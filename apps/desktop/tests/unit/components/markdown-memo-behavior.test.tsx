import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { PromptMarkdownContent } from "../../../src/renderer/components/prompt/PromptMarkdownContent";
import { AgentConversationMarkdown } from "../../../src/renderer/components/agent/AgentConversationMarkdown";

/**
 * react-markdown re-parses its full input on every render. These tests pin
 * the memo contracts that keep unrelated re-renders from re-parsing markdown:
 * stable module-level plugin identities plus value-based prop comparison.
 */

const { markdownSpy } = vi.hoisted(() => ({
  markdownSpy: vi.fn((props: { children?: unknown }) => null),
}));

vi.mock("react-markdown", () => ({
  default: (props: { children?: unknown }) => markdownSpy(props),
}));

function ParentRerenderHarness({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, setTick] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setTick((value) => value + 1)}>
        rerender-parent
      </button>
      {children}
    </div>
  );
}

/** Rebuilds highlightTerms as a fresh array identity on every render. */
function FreshTermsHarness({ content, term }: { content: string; term: string }) {
  const highlightTerms = [term];
  return (
    <ParentRerenderHarness>
      <PromptMarkdownContent
        content={content}
        highlightTerms={highlightTerms}
      />
    </ParentRerenderHarness>
  );
}

describe("PromptMarkdownContent memo contract", () => {
  it("skips markdown re-render when the parent re-renders with a fresh but value-equal terms array", async () => {
    const user = userEvent.setup();
    markdownSpy.mockClear();

    render(<FreshTermsHarness content="stable body" term="body" />);
    expect(markdownSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "rerender-parent" }));
    await user.click(screen.getByRole("button", { name: "rerender-parent" }));

    expect(markdownSpy).toHaveBeenCalledTimes(1);
  });

  it("re-renders markdown only when content or term values change", () => {
    markdownSpy.mockClear();

    const { rerender } = render(
      <FreshTermsHarness content="stable body" term="body" />,
    );
    expect(markdownSpy).toHaveBeenCalledTimes(1);

    rerender(<FreshTermsHarness content="updated body" term="body" />);
    expect(markdownSpy).toHaveBeenCalledTimes(2);

    rerender(<FreshTermsHarness content="updated body" term="other" />);
    expect(markdownSpy).toHaveBeenCalledTimes(3);
  });
});

describe("AgentConversationMarkdown memo contract", () => {
  it("does not re-render markdown when an unrelated parent state changes", async () => {
    const user = userEvent.setup();
    markdownSpy.mockClear();

    render(
      <ParentRerenderHarness>
        <AgentConversationMarkdown content="## transcript entry" />
      </ParentRerenderHarness>,
    );
    expect(markdownSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "rerender-parent" }));
    await user.click(screen.getByRole("button", { name: "rerender-parent" }));

    expect(markdownSpy).toHaveBeenCalledTimes(1);
  });

  it("re-renders markdown when the content changes", () => {
    markdownSpy.mockClear();

    const { rerender } = render(
      <ParentRerenderHarness>
        <AgentConversationMarkdown content="first" />
      </ParentRerenderHarness>,
    );
    expect(markdownSpy).toHaveBeenCalledTimes(1);

    rerender(
      <ParentRerenderHarness>
        <AgentConversationMarkdown content="second" />
      </ParentRerenderHarness>,
    );
    expect(markdownSpy).toHaveBeenCalledTimes(2);
  });
});
