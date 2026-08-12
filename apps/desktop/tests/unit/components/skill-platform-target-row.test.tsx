import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import { SHARED_AGENT_SKILLS_TARGET_ID } from "@prompthub/shared/constants/skill-distribution-targets";
import { SkillPlatformTargetRow } from "../../../src/renderer/components/skill/SkillPlatformTargetRow";
import type { SkillPlatform } from "@prompthub/shared/constants/platforms";

// Minimal t stub: returns the key so assertions can look up by key.
const t = ((key: string) => key) as unknown as TFunction;
const noop = () => {};

function makePlatform(id: string): SkillPlatform {
  return {
    id,
    name: id,
    icon: "Bot",
    rootDir: { darwin: "~/" + id, win32: "~/" + id, linux: "~/" + id },
    skillsRelativePath: "skills",
  } as SkillPlatform;
}

describe("SkillPlatformTargetRow detection hint", () => {
  it("shows the not-detected hint when enabled target is undetected and not installed", () => {
    render(
      <SkillPlatformTargetRow
        isBatchInstalling={false}
        isInstalled={false}
        isSelected={false}
        isDetected={false}
        onToggle={noop}
        onUninstall={noop}
        platform={makePlatform("cursor")}
        t={t}
      />,
    );
    expect(
      screen.getByText("skill.platformNotDetectedHint"),
    ).toBeInTheDocument();
  });

  it("does not show the hint when the target is detected", () => {
    render(
      <SkillPlatformTargetRow
        isBatchInstalling={false}
        isInstalled={false}
        isSelected={false}
        isDetected={true}
        onToggle={noop}
        onUninstall={noop}
        platform={makePlatform("cursor")}
        t={t}
      />,
    );
    expect(
      screen.queryByText("skill.platformNotDetectedHint"),
    ).not.toBeInTheDocument();
  });

  it("does not show the hint when already installed even if undetected", () => {
    render(
      <SkillPlatformTargetRow
        isBatchInstalling={false}
        isInstalled={true}
        isSelected={false}
        isDetected={false}
        onToggle={noop}
        onUninstall={noop}
        platform={makePlatform("cursor")}
        t={t}
      />,
    );
    expect(
      screen.queryByText("skill.platformNotDetectedHint"),
    ).not.toBeInTheDocument();
  });

  it("never shows the hint for the shared distribution target", () => {
    render(
      <SkillPlatformTargetRow
        isBatchInstalling={false}
        isInstalled={false}
        isSelected={false}
        isDetected={false}
        onToggle={noop}
        onUninstall={noop}
        platform={makePlatform(SHARED_AGENT_SKILLS_TARGET_ID)}
        t={t}
      />,
    );
    expect(
      screen.queryByText("skill.platformNotDetectedHint"),
    ).not.toBeInTheDocument();
  });

  it("does not show the hint when detection is unknown (back-compat)", () => {
    render(
      <SkillPlatformTargetRow
        isBatchInstalling={false}
        isInstalled={false}
        isSelected={false}
        onToggle={noop}
        onUninstall={noop}
        platform={makePlatform("cursor")}
        t={t}
      />,
    );
    expect(
      screen.queryByText("skill.platformNotDetectedHint"),
    ).not.toBeInTheDocument();
  });
});
