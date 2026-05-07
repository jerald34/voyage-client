"use client";

import React from 'react';
import './AgentMarkdown.css';

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

/* ── Table helpers ─────────────────────────────────────────────── */

/** A line looks like a table row if it contains at least one pipe character */
function isTableRow(line) {
  return line.trim().includes('|');
}

/** The separator row must consist only of pipes, dashes, colons and spaces */
function isTableSeparator(line) {
  return /^\|?[\s:]*-{2,}[\s:|-]*\|?$/.test(line.trim());
}

/** Split a pipe-delimited row into cell strings */
function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((c) => c.trim());
}

/** Derive column alignments from a separator row (left / center / right / null) */
function parseAlignments(sepLine) {
  return splitTableRow(sepLine).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
}


/* ── Inline rendering ──────────────────────────────────────────── */

function renderInline(text, keyPrefix = 'inline', options = {}) {
  const { renderText = (t) => t } = options;
  const nodes = [];
  let tokenIndex = 0;

  // Fallback renderer below uses a simple left-to-right scan with safe token detection.
  const tokenRegex = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\s][^*\n]*?[^*\s]\*|_[^_\s][^_\n]*?[^_\s]_|\[[^\]\n]+\]\((?:https?:\/\/|\/)[^) \n]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(renderText(text.slice(lastIndex, match.index), createKey(keyPrefix, `${tokenIndex}-pre`)));
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
          {renderInline(token.slice(2, -2), `${keyPrefix}-strong-${tokenIndex}`, options)}
        </strong>
      );
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(
        <em key={createKey(keyPrefix, tokenIndex)}>
          {renderInline(token.slice(1, -1), `${keyPrefix}-em-${tokenIndex}`, options)}
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
          {renderInline(label, `${keyPrefix}-link-${tokenIndex}`, options)}
        </a>
      );
    }

    lastIndex = tokenRegex.lastIndex;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(renderText(text.slice(lastIndex), createKey(keyPrefix, `${tokenIndex}-post`)));
  }

  return nodes;
}

function renderParagraph(text, index, options) {
  const lines = text.split('\n');

  return (
    <p key={createKey('paragraph', index)} className="markdown-paragraph">
      {lines.map((line, lineIndex) => (
        <React.Fragment key={createKey(`paragraph-line-${index}`, lineIndex)}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line, `paragraph-${index}-line-${lineIndex}`, options)}
        </React.Fragment>
      ))}
    </p>
  );
}

function renderBlockQuote(lines, index, options) {
  return (
    <blockquote key={createKey('blockquote', index)} className="markdown-blockquote">
      {lines.map((line, lineIndex) => (
        <div key={createKey(`blockquote-line-${index}`, lineIndex)}>
          {renderInline(stripQuotePrefix(line), `blockquote-${index}-line-${lineIndex}`, options)}
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

function renderList(items, ordered, index, options) {
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag key={createKey('list', index)} className={`markdown-list ${ordered ? 'ordered' : 'unordered'}`}>
      {items.map((item, itemIndex) => (
        <li key={createKey(`list-item-${index}`, itemIndex)}>{renderInline(item, `list-${index}-item-${itemIndex}`, options)}</li>
      ))}
    </ListTag>
  );
}

/* ── Detect whether the current position starts a GFM table ──── */

function tryParseTable(lines, startIndex) {
  // We need at least 2 lines: header + separator
  if (startIndex + 1 >= lines.length) return null;

  const headerLine = lines[startIndex];
  const sepLine = lines[startIndex + 1];

  if (!isTableRow(headerLine) || !isTableSeparator(sepLine)) return null;

  // Gather body rows (continue while lines contain pipes)
  const bodyLines = [];
  let j = startIndex + 2;
  while (j < lines.length && !isBlankLine(lines[j]) && isTableRow(lines[j])) {
    bodyLines.push(lines[j]);
    j += 1;
  }

  return { headerLine, sepLine, bodyLines, endIndex: j };
}

/* ── Main block parser ─────────────────────────────────────────── */

export function renderMarkdownContent(content, options = {}) {
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
          {renderInline(headingMatch[2], `heading-${blockIndex}`, options)}
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
      blocks.push(renderBlockQuote(quoteLines, blockIndex, options));
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
      blocks.push(renderList(items, ordered, blockIndex, options));
      blockIndex += 1;
      continue;
    }

    /* ── Table detection (must come before paragraph fallback) ── */
    const tableResult = tryParseTable(lines, i);
    if (tableResult) {
      blocks.push(
        renderTable(
          tableResult.headerLine,
          tableResult.sepLine,
          tableResult.bodyLines,
          blockIndex,
          options
        ),
      );
      i = tableResult.endIndex;
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

    blocks.push(renderParagraph(paragraphLines.join('\n'), blockIndex, options));
    blockIndex += 1;
  }

  return blocks;
}

function renderTable(headerLine, separatorLine, bodyLines, blockIndex, options) {
  const headers = splitTableRow(headerLine);
  const alignments = parseAlignments(separatorLine);
  const rows = bodyLines.map(splitTableRow);

  return (
    <div key={createKey('table-wrap', blockIndex)} className="markdown-table-wrapper">
      <table className="markdown-table">
        <thead>
          <tr>
            {headers.map((cell, ci) => (
              <th
                key={createKey(`th-${blockIndex}`, ci)}
                style={alignments[ci] ? { textAlign: alignments[ci] } : undefined}
              >
                {renderInline(cell, `th-${blockIndex}-${ci}`, options)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={createKey(`tr-${blockIndex}`, ri)}>
              {headers.map((_, ci) => (
                <td
                  key={createKey(`td-${blockIndex}-${ri}`, ci)}
                  style={alignments[ci] ? { textAlign: alignments[ci] } : undefined}
                >
                  {renderInline(row[ci] ?? '', `td-${blockIndex}-${ri}-${ci}`, options)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarkdownContent({ content, renderText }) {
  return <>{renderMarkdownContent(content, { renderText })}</>;
}
