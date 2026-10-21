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

  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_\n]+)__/g, '<u>$1</u>');
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  text = text.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');
  text = text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  text = text.replace(/\n/g, '<br>');

  text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
  return text;
}
