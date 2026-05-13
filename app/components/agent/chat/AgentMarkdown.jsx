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
        <code
          key={createKey(keyPrefix, tokenIndex)}
          className="px-[0.35em] py-[0.15em] rounded-md bg-black/[0.06] font-mono text-[0.92em]"
        >
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
          className="text-secondary underline underline-offset-2 break-words hover:text-primary font-semibold"
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
    <p key={createKey('paragraph', index)} className="m-0">
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
    <blockquote
      key={createKey('blockquote', index)}
      className="m-0 py-2 px-3 border-l-[3px] border-secondary bg-black/[0.03] rounded-[0_10px_10px_0] text-text-soft italic"
    >
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
    <pre
      key={createKey('code', startIndex)}
      className="m-0 p-3 rounded-xl bg-[rgba(24,27,31,0.96)] text-[#f6f7f9] overflow-x-auto max-w-full whitespace-pre-wrap break-all text-xs leading-[1.5]"
    >
      <code
        data-language={language || undefined}
        className="font-mono"
      >
        {code}
      </code>
    </pre>
  );
}

function renderList(items, ordered, index, options) {
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag
      key={createKey('list', index)}
      className={`m-0 pl-5 flex flex-col gap-1 ${ordered ? 'list-decimal' : 'list-disc'}`}
    >
      {items.map((item, itemIndex) => (
        <li key={createKey(`list-item-${index}`, itemIndex)}>
          {renderInline(item, `list-${index}-item-${itemIndex}`, options)}
        </li>
      ))}
    </ListTag>
  );
}

/* ── Detect whether the current position starts a GFM table ──── */

function tryParseTable(lines, startIndex) {
  if (startIndex + 1 >= lines.length) return null;

  const headerLine = lines[startIndex];
  const sepLine = lines[startIndex + 1];

  if (!isTableRow(headerLine) || !isTableSeparator(sepLine)) return null;

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
      const headingSizeMap = {
        1: 'text-[22px]',
        2: 'text-[18px]',
        3: 'text-[16px]',
        4: 'text-[14px]',
        5: 'text-[14px]',
        6: 'text-[14px]',
      };
      blocks.push(
        <HeadingTag
          key={createKey('heading', blockIndex)}
          className={`m-0 leading-tight font-bold tracking-[-0.01em] ${headingSizeMap[level] || 'text-sm'}`}
        >
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
    <div key={createKey('table-wrap', blockIndex)} className="overflow-x-auto my-3 rounded-xl border border-border/20 bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((cell, ci) => (
              <th
                key={createKey(`th-${blockIndex}`, ci)}
                style={alignments[ci] ? { textAlign: alignments[ci] } : undefined}
                className="px-3.5 py-2.5 border-b border-border/20 text-left bg-background font-bold text-[11px] uppercase tracking-[0.05em] text-primary"
              >
                {renderInline(cell, `th-${blockIndex}-${ci}`, options)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={createKey(`tr-${blockIndex}`, ri)} className="even:bg-[#fafafa] hover:bg-secondary/[0.04]">
              {headers.map((_, ci) => (
                <td
                  key={createKey(`td-${blockIndex}-${ri}`, ci)}
                  style={alignments[ci] ? { textAlign: alignments[ci] } : undefined}
                  className="px-3.5 py-2.5 border-b border-border/20 last:[&]:border-b-0 text-left"
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
