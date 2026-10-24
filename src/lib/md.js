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

  text = text.replace(
    /^(#{1,3})[ \t]+(.+?)[ \t]*(?:\n|$)/gm,
    (_, hashes, content) => {
      const level = hashes.length;
      return `<h${level} class="md-header md-h${level}">${content}</h${level}>`;
    }
  );

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

  text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
  return text;
}