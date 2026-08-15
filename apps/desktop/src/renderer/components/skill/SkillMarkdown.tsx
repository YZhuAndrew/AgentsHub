import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import {
  memo,
  useMemo,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  resolveGitHubMarkdownBase,
  resolveGitHubMarkdownUrl,
  type GitHubMarkdownBase,
} from "./detail-utils";

interface SkillMarkdownProps {
  content: string;
  sourceUrl?: string;
  contentUrl?: string;
  enableHighlight?: boolean;
  trackSourceLines?: boolean;
}

interface MarkdownTreeNode {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  position?: { start?: { line?: number } };
  children?: MarkdownTreeNode[];
}

const SOURCE_LINE_BLOCKS = new Set([
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "p",
  "pre",
  "table",
]);

function addSourceLineMarkers(node: MarkdownTreeNode) {
  const line = node.position?.start?.line;
  if (
    node.type === "element" &&
    node.tagName &&
    SOURCE_LINE_BLOCKS.has(node.tagName) &&
    typeof line === "number"
  ) {
    node.properties = {
      ...node.properties,
      "data-source-line": String(line),
    };
  }
  node.children?.forEach(addSourceLineMarkers);
}

function rehypeSourceLineMarkers() {
  return (tree: MarkdownTreeNode) => addSourceLineMarkers(tree);
}

function readMarkdownText(node: MarkdownTreeNode): string {
  if (node.type === "text") return node.value!;
  return node.children!.map(readMarkdownText).join("");
}

function createHeadingSlug(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function addHeadingIds(tree: MarkdownTreeNode) {
  const usedSlugs = new Map<string, number>();

  const visit = (node: MarkdownTreeNode) => {
    if (node.type === "element" && /^h[1-6]$/.test(node.tagName!)) {
      const baseSlug = createHeadingSlug(readMarkdownText(node)) || "section";
      const duplicateIndex = usedSlugs.get(baseSlug) ?? 0;
      usedSlugs.set(baseSlug, duplicateIndex + 1);
      node.properties = {
        ...node.properties,
        id: duplicateIndex ? `${baseSlug}-${duplicateIndex}` : baseSlug,
      };
    }
    node.children?.forEach(visit);
  };

  visit(tree);
}

function rehypeHeadingIds() {
  return (tree: MarkdownTreeNode) => addHeadingIds(tree);
}

function scrollToMarkdownAnchor(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
) {
  event.preventDefault();
  let targetId = href.slice(1);
  try {
    targetId = decodeURIComponent(targetId);
  } catch {
    // The literal fragment remains usable when percent decoding fails.
  }
  const root = event.currentTarget.closest<HTMLElement>(
    "[data-markdown-root]",
  )!;
  const target = [...root.querySelectorAll<HTMLElement>("[id]")].find(
    (element) => element.id === targetId,
  );
  target?.scrollIntoView({ block: "start" });
}

function createMarkdownComponentOverrides(
  markdownBase: GitHubMarkdownBase | null,
) {
  return {
    a: ({
      children,
      href,
      node: _node,
      ...props
    }: ComponentProps<"a"> & { node?: unknown }) => {
      const safeHref =
        typeof href === "string"
          ? resolveGitHubMarkdownUrl(href, markdownBase, "link")
          : href;

      if (!safeHref) {
        return <span {...props}>{children}</span>;
      }

      const isDocumentAnchor = safeHref.startsWith("#");
      return (
        <a
          {...props}
          href={safeHref}
          target={isDocumentAnchor ? undefined : "_blank"}
          rel={isDocumentAnchor ? undefined : "noopener noreferrer"}
          onClick={
            isDocumentAnchor
              ? (event) => scrollToMarkdownAnchor(event, safeHref)
              : undefined
          }
        >
          {children}
        </a>
      );
    },
    img: ({
      src,
      alt,
      node: _node,
      ...props
    }: ComponentProps<"img"> & { node?: unknown }) => {
      const safeSrc =
        typeof src === "string"
          ? resolveGitHubMarkdownUrl(src, markdownBase, "image")
          : src;

      if (!safeSrc) {
        return alt ? <span>{alt}</span> : null;
      }

      return <img {...props} src={safeSrc} alt={alt || ""} loading="lazy" />;
    },
  };
}

// Parsing the document with remark/rehype (especially syntax highlighting)
// is the most expensive render in the skill preview. Plugin arrays and
// component overrides are kept stable per inputs so unrelated parent
// re-renders do not force react-markdown to rebuild its tree.
const REMARK_PLUGINS: ComponentProps<typeof ReactMarkdown>["remarkPlugins"] = [
  remarkGfm,
];
const REHYPE_PLUGINS_HIGHLIGHT: ComponentProps<
  typeof ReactMarkdown
>["rehypePlugins"] = [
  [rehypeHighlight, { ignoreMissing: true }],
  rehypeSanitize,
];
const REHYPE_PLUGINS_PLAIN: ComponentProps<
  typeof ReactMarkdown
>["rehypePlugins"] = [rehypeSanitize];

export const SkillMarkdown = memo(function SkillMarkdown({
  content,
  sourceUrl,
  contentUrl,
  enableHighlight = false,
  trackSourceLines = false,
}: SkillMarkdownProps) {
  const markdownBase = useMemo(
    () => resolveGitHubMarkdownBase(sourceUrl, contentUrl),
    [sourceUrl, contentUrl],
  );
  const components = useMemo(
    () => createMarkdownComponentOverrides(markdownBase),
    [markdownBase],
  );
  const rehypePlugins = useMemo(() => {
    const plugins = enableHighlight
      ? [...REHYPE_PLUGINS_HIGHLIGHT]
      : [...REHYPE_PLUGINS_PLAIN];
    plugins.push(rehypeHeadingIds);
    if (trackSourceLines) {
      plugins.push(rehypeSourceLineMarkers);
    }
    return plugins;
  }, [enableHighlight, trackSourceLines]);

  return (
    <div data-markdown-root className="contents">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
