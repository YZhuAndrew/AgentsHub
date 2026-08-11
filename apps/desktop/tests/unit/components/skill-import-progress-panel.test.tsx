import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { SkillImportProgressPanel } from "../../../src/renderer/components/skill/SkillImportProgressPanel";
import type { SkillImportProgressDetail } from "@prompthub/shared/types";
import { renderWithI18n } from "../../helpers/i18n";

function progress(
  overrides: Partial<SkillImportProgressDetail>,
): SkillImportProgressDetail {
  return {
    kind: "install",
    phase: "staging",
    message: "cloning-repository",
    requestId: "req-1",
    ...overrides,
  };
}

describe("SkillImportProgressPanel", () => {
  it("renders the localized phase label and clone percentage bar", async () => {
    await renderWithI18n(
      <SkillImportProgressPanel progress={progress({ clonePercent: 47 })} />,
    );
    // The English value for skill.importProgress.cloning.
    expect(await screen.findByText("Cloning repository…")).toBeInTheDocument();
    expect(screen.getByText("47%")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "47");
  });

  it("renders the batch counter when multiple skills are imported", async () => {
    await renderWithI18n(
      <SkillImportProgressPanel
        progress={progress({ message: "safety-scanning" })}
        batchIndex={2}
        batchTotal={5}
        batchSkillName="writer"
      />,
    );
    expect(await screen.findByText(/2 \/ 5: writer/)).toBeInTheDocument();
    // safety-scanning has no clone percent, so no progressbar is rendered.
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("falls back to the processing label when no progress detail is available", async () => {
    await renderWithI18n(<SkillImportProgressPanel progress={null} />);
    expect(await screen.findByText("Processing…")).toBeInTheDocument();
  });
});
