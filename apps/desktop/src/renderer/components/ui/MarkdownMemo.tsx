import { memo, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Shared memoized react-markdown wrapper for hot rendering paths.
 *
 * react-markdown re-parses its full input on every render, so:
 * - the remark plugin array keeps a single module-level identity
 * - the component is memoized, so unrelated parent re-renders (typing in a
 *   different field, streaming updates in a sibling pane) skip re-parsing
 *
 * Pass stable `rehypePlugins` / `components` props (e.g. via useMemo) or the
 * memo comparison will bail every render.
 */
export const REMARK_GFM_PLUGINS: ComponentProps<typeof ReactMarkdown>["remarkPlugins"] = [
  remarkGfm,
];

type MarkdownMemoProps = {
  content: string;
  rehypePlugins?: ComponentProps<typeof ReactMarkdown>["rehypePlugins"];
  components?: ComponentProps<typeof ReactMarkdown>["components"];
};

export const MarkdownMemo = memo(function MarkdownMemo({
  content,
  rehypePlugins,
  components,
}: MarkdownMemoProps) {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_GFM_PLUGINS}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
});
