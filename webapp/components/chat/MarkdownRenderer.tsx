"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="text-sm leading-6 text-[#3c3437]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-semibold tracking-[-0.02em] text-qu-ink first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-lg font-semibold tracking-[-0.02em] text-qu-ink first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-bold text-qu-ink">{children}</h3>,
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-qu-ink">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-qu-maroon underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="soft-scrollbar my-4 overflow-x-auto rounded-2xl border border-qu-rose-border bg-white shadow-sm">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#f6ecef]">{children}</thead>,
          th: ({ children }) => (
            <th className="whitespace-nowrap border-b border-qu-rose-border px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.06em] text-qu-maroon">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-[#f1eaec] px-4 py-3 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
