import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export type MarkdownVariant = "document" | "compact";

export interface MarkdownProps {
  children: string;
  className?: string;
  /** document = prose reading pane; compact = chat/message bubbles */
  variant?: MarkdownVariant;
  components?: Components;
}

/**
 * Shared Markdown renderer (GFM tables/task lists + fenced code highlighting).
 * Import `@platform/markdown/styles.css` once at the app/site entry (or rely on
 * the Document Explorer / consumers that already import it).
 */
export function Markdown({
  children,
  className,
  variant = "document",
  components,
}: MarkdownProps) {
  const classes = ["platformMarkdown", variant === "compact" ? "platformMarkdownCompact" : "platformMarkdownDocument", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
