"use client";

import React from 'react';

function isBlankLine(line) {
  return !line || !line.trim();
}

function findClosingFence(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith('```')) {
      return i;
    }
  }
  return -1;
}

function canStartHeading(line) {
  return /^(#{1,6})\s+/.test(line);
}

function canStartList(line) {
  return /^(\s*)([-*+]|(\d+\.))\s+/.test(line);
}

function canStartBlockquote(line) {
  return /^>\s?/.test(line);
}

function stripQuotePrefix(line) {
  return line.replace(/^>\s?/, '');
}

function stripListPrefix(line) {
  return line.replace(/^(\s*)([-*+]|(\d+\.))\s+/, '');
}

function createKey(prefix, index) {
  return `${prefix}-${index}`;
}

function renderInline(text, keyPrefix = 'inline') {
  const nodes = [];
  let tokenIndex = 0;

  // Fallback renderer below uses a simple left-to-right scan with safe token detection.
  const tokenRegex = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\s][^*\n]*?[^*\s]\*|_[^_\s][^_\n]*?[^_\s]_|\[[^\]\n]+\]\((?:https?:\/\/|\/)[^) \n]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('`')) {
      nodes.push(
        <code key={createKey(keyPrefix, tokenIndex)} className="inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong key={createKey(keyPrefix, tokenIndex)}>
          {renderInline(token.slice(2, -2), `${keyPrefix}-strong-${tokenIndex}`)}
        </strong>
      );
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(
        <em key={createKey(keyPrefix, tokenIndex)}>
          {renderInline(token.slice(1, -1), `${keyPrefix}-em-${tokenIndex}`)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const closeBracket = token.indexOf(']');
      const openParen = token.indexOf('(', closeBracket + 1);
      const closeParen = token.lastIndexOf(')');
      const label = token.slice(1, closeBracket);
      const href = token.slice(openParen + 1, closeParen).trim();
      nodes.push(
        <a
          key={createKey(keyPrefix, tokenIndex)}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="markdown-link"
        >
          {renderInline(label, `${keyPrefix}-link-${tokenIndex}`)}
        </a>
      );
    }

    lastIndex = tokenRegex.lastIndex;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderParagraph(text, index) {
  const lines = text.split('\n');

  return (
    <p key={createKey('paragraph', index)} className="markdown-paragraph">
      {lines.map((line, lineIndex) => (
        <React.Fragment key={createKey(`paragraph-line-${index}`, lineIndex)}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line, `paragraph-${index}-line-${lineIndex}`)}
        </React.Fragment>
      ))}
    </p>
  );
}

function renderBlockQuote(lines, index) {
  return (
    <blockquote key={createKey('blockquote', index)} className="markdown-blockquote">
      {lines.map((line, lineIndex) => (
        <div key={createKey(`blockquote-line-${index}`, lineIndex)}>
          {renderInline(stripQuotePrefix(line), `blockquote-${index}-line-${lineIndex}`)}
        </div>
      ))}
    </blockquote>
  );
}

function renderCodeBlock(lines, startIndex, endIndex) {
  const firstLine = lines[startIndex].trim();
  const language = firstLine.replace(/^```/, '').trim();
  const code = lines.slice(startIndex + 1, endIndex).join('\n');

  return (
    <pre key={createKey('code', startIndex)} className="markdown-code-block">
      <code data-language={language || undefined}>{code}</code>
    </pre>
  );
}

function renderList(items, ordered, index) {
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag key={createKey('list', index)} className={`markdown-list ${ordered ? 'ordered' : 'unordered'}`}>
      {items.map((item, itemIndex) => (
        <li key={createKey(`list-item-${index}`, itemIndex)}>{renderInline(item, `list-${index}-item-${itemIndex}`)}</li>
      ))}
    </ListTag>
  );
}

export function renderMarkdownContent(content) {
  const text = String(content ?? '').replace(/\r\n/g, '\n');
  if (!text.trim()) {
    return null;
  }

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  let blockIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlankLine(line)) {
      i += 1;
      continue;
    }

    if (line.trim().startsWith('```')) {
      const closingFence = findClosingFence(lines, i + 1);
      const fenceEnd = closingFence === -1 ? lines.length : closingFence;
      blocks.push(renderCodeBlock(lines, i, fenceEnd));
      i = closingFence === -1 ? lines.length : closingFence + 1;
      blockIndex += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const HeadingTag = `h${level}`;
      blocks.push(
        <HeadingTag key={createKey('heading', blockIndex)} className={`markdown-heading level-${level}`}>
          {renderInline(headingMatch[2], `heading-${blockIndex}`)}
        </HeadingTag>
      );
      i += 1;
      blockIndex += 1;
      continue;
    }

    if (canStartBlockquote(line)) {
      const quoteLines = [];
      while (i < lines.length && !isBlankLine(lines[i]) && canStartBlockquote(lines[i])) {
        quoteLines.push(lines[i]);
        i += 1;
      }
      blocks.push(renderBlockQuote(quoteLines, blockIndex));
      blockIndex += 1;
      continue;
    }

    if (canStartList(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && !isBlankLine(lines[i]) && canStartList(lines[i])) {
        const current = lines[i];
        const currentOrdered = /^\s*\d+\.\s+/.test(current);
        if (currentOrdered !== ordered) {
          break;
        }
        items.push(stripListPrefix(current).trim());
        i += 1;
      }
      blocks.push(renderList(items, ordered, blockIndex));
      blockIndex += 1;
      continue;
    }

    const paragraphLines = [];
    while (
      i < lines.length &&
      !isBlankLine(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !canStartHeading(lines[i]) &&
      !canStartBlockquote(lines[i]) &&
      !canStartList(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }

    blocks.push(renderParagraph(paragraphLines.join('\n'), blockIndex));
    blockIndex += 1;
  }

  return blocks;
}

export default function MarkdownContent({ content }) {
  return <>{renderMarkdownContent(content)}</>;
}
