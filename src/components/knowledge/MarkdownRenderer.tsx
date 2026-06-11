'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

interface MarkdownRendererProps {
  content: string;
}

const embedAllowlist = [
  'youtube.com',
  'youtu.be',
  'gist.github.com',
];

const sanitizeSchema = {
  tagNames: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  attributeNames: ['className', 'id', 'href', 'src', 'alt', 'title', 'width', 'height', 'loading', 'target', 'rel'],
  protocols: ['https', 'http', 'data'],
};

function validateUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/') || url.startsWith('#')) return true;
  try {
    const parsed = new URL(url);
    return embedAllowlist.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components = useMemo(
    () => ({
      a: ({ node, ...props }: any) => {
        const { href, children, ...rest } = props;
        if (href && !href.startsWith('/') && !href.startsWith('#')) {
          return (
            <a href={validateUrl(href) ? href : '#'} target="_blank" rel="noopener noreferrer" {...rest}>
              {children}
            </a>
          );
        }
        return <a {...rest} />;
      },
      img: ({ node, ...props }: any) => {
        const { src, alt, ...rest } = props;
        return (
          <img
            src={validateUrl(src) ? src : '/placeholder.png'}
            alt={alt}
            loading="lazy"
            className="max-w-full h-auto rounded-lg"
            {...rest}
          />
        );
      },
      pre: ({ node, ...props }: any) => (
        <pre className="overflow-x-auto rounded-lg bg-bg-secondary p-4" {...props} />
      ),
      code: ({ node, className, children, ...props }: any) => {
        const isInline = !className;
        return isInline ? (
          <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-sm" {...props} />
        ) : (
          <code className={className} {...props} />
        );
      },
    }),
    []
  );

  return (
    <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:relative">
      <ReactMarkdown
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'append' }],
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}