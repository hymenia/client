import { shortcodeToEmoji } from '$lib/shortcodes.js';
import twemoji from '@twemoji/api';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // stops user text from breaking the page and prevents xss
    .replace(/\u0000/g, '&#0;');
}

const TABLE_SEP_RE = /^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/;

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function alignOf(spec) {
  const s = spec.trim();
  const left = s.startsWith(':');
  const right = s.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return '';
}

function renderTables(text) {
  const lines = text.split('\n');
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    const sep = lines[i + 1];

    const isTableStart =
      sep !== undefined &&
      header.includes('|') &&
      sep.includes('|') &&
      TABLE_SEP_RE.test(sep);

    if (!isTableStart) {
      out.push(header);
      continue;
    }

    const headCells = splitRow(header);
    const aligns = splitRow(sep).map(alignOf);

    // only treat it as a table if the column counts match
    if (headCells.length !== aligns.length) {
      out.push(header);
      continue;
    }

    const cols = headCells.length;
    const cls = (idx) => (aligns[idx] ? ` class="md-align-${aligns[idx]}"` : '');

    let html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
    headCells.forEach((cell, idx) => {
      html += `<th${cls(idx)}>${cell}</th>`;
    });
    html += '</tr></thead><tbody>';

    let j = i + 2;
    while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
      const cells = splitRow(lines[j]);
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td${cls(c)}>${cells[c] ?? ''}</td>`;
      }
      html += '</tr>';
      j++;
    }

    html += '</tbody></table></div>';
    out.push(html);
    i = j - 1;
  }

  return out.join('\n');
}

export function renderMarkdown(input) {
  if (typeof input !== 'string' || !input) return '';
  let text = escapeHtml(input);

  const blocks = [];
  function stash(html) {
    blocks.push(html);
    return `\u0000${blocks.length - 1}\u0000`;
  }

  // so that their contents arent changed
  text = text.replace(/```\n?([\s\S]+?)\n?```/g, (_, code) =>
    stash(`<pre><code>${code}</code></pre>`)
  );
  text = text.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${code}</code>`));

  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/gi,
    (match, label, url) => {
      if (!/^(https?:\/\/|mailto:)/i.test(url)) return match;
      return stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    }
  );

  text = text.replace(/https?:\/\/[^\s<]+/gi, (match) => {
    const url = match.replace(/[.,!?;:)\]}]+$/g, '');
    const trailing = match.slice(url.length);
    if (!url) return match;
    return stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`) + trailing;
  });

  text = renderTables(text);

  // # to ###
  text = text.replace(
    /^(#{1,3})[ \t]+(.+?)[ \t]*(?:\n|$)/gm,
    (_, hashes, content) => {
      const level = hashes.length;
      return `<h${level} class="md-header md-h${level}">${content}</h${level}>`;
    }
  );

  // multiple > merge into one
  text = text.replace(/^(?:&gt;[ \t]?.*(?:\n|$))+/gm, (block) => {
    const inner = block
      .replace(/\n$/, '')
      .split('\n')
      .map((line) => line.replace(/^&gt;[ \t]?/, ''))
      .join('\n');
    return `<blockquote class="md-quote">${inner}</blockquote>`;
  });

  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_\n]+)__/g, '<u>$1</u>');
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  text = text.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');
  text = text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  text = text.replace(/\n/g, '<br>');

  // no stray line breaks around a table block
  text = text.replace(/(<\/table><\/div>)<br>/g, '$1');
  text = text.replace(/<br>(<div class="md-table-wrap">)/g, '$1');

  text = text.replace(/:([a-z0-9_+-]+):/g, (match, name) => shortcodeToEmoji(name) ?? match);

  text = twemoji.parse(text, { folder: 'svg', ext: '.svg', className: 'emoji' });

  text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
  return text;
}