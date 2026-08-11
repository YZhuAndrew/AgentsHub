import { useMemo, useState } from "react";
import {
  BotIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CuboidIcon,
  FolderPlusIcon,
  LinkIcon,
  PlusIcon,
  StoreIcon,
} from "lucide-react";
import type { Skill } from "@prompthub/shared/types";
import { getRemoteStoreSkillCount } from "../../services/remote-store-entry";
import { getPrimarySkillSourceBadge } from "../../services/skill-source-badges";
import { SidebarNavigationItem } from "./SidebarNavigationItem";
import { SidebarResourceTagPanel } from "./SidebarResourceTagPanel";
import type { SidebarController } from "./sidebar-view-types";

const FILTER_SECTION_PREVIEW_LIMIT = 6;

/** A single entry in a sidebar filter section (source or author). */
interface FilterEntry {
  value: string;
  label: string;
  count: number;
}

/** Derive distinct source filter entries from the loaded skills. */
function useSkillSourceEntries(skills: Skill[], t: SidebarController["t"]) {
  return useMemo(() => {
    const entries = new Map<string, FilterEntry>();
    for (const skill of skills) {
      const badge = getPrimarySkillSourceBadge(skill, t);
      if (!badge) continue;
      const current = entries.get(badge.key);
      entries.set(badge.key, {
        value: badge.key,
        label: String(badge.label),
        count: (current?.count ?? 0) + 1,
      });
    }
    return Array.from(entries.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [skills, t]);
}

/** Derive distinct author filter entries from the loaded skills. */
function useSkillAuthorEntries(skills: Skill[]) {
  return useMemo(() => {
    const entries = new Map<string, FilterEntry>();
    for (const skill of skills) {
      const author = skill.author?.trim();
      if (!author) continue;
      const current = entries.get(author);
      entries.set(author, {
        value: author,
        label: author,
        count: (current?.count ?? 0) + 1,
      });
    }
    return Array.from(entries.values()).sort((a, b) => {
      // Default: most skills first; fall back to alphabetical for stability.
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
  }, [skills]);
}

/**
 * A collapsible sidebar filter section (source or author). Two display
 * variants: "pills" (toggle chips, used for sources) and "list" (vertical
 * rows with a count badge, used for authors). Collapsible, default expanded.
 */
function SidebarSkillFilterSection({
  title,
  entries,
  activeValue,
  onSelect,
  onClear,
  isCollapsed,
  setIsCollapsed,
  showAll,
  setShowAll,
  t,
  variant = "pills",
}: {
  title: string;
  entries: FilterEntry[];
  activeValue: string;
  onSelect: (value: string) => void;
  onClear: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showAll: boolean;
  setShowAll: (show: boolean) => void;
  t: SidebarController["t"];
  variant?: "pills" | "list";
}) {
  if (entries.length === 0) return null;
  const hasActive = activeValue !== "all";
  const visible = showAll
    ? entries
    : entries.slice(0, FILTER_SECTION_PREVIEW_LIMIT);
  const hasMore = entries.length > FILTER_SECTION_PREVIEW_LIMIT;
  return (
    <div className="sidebar-tag-section shrink-0 flex flex-col overflow-hidden app-wallpaper-panel">
      <div className="flex items-center justify-between px-6 py-2 border-t border-sidebar-border/50 shrink-0">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          className="flex items-center gap-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/80 transition-colors"
        >
          {isCollapsed ? (
            <ChevronUpIcon className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="w-3 h-3" aria-hidden="true" />
          )}
          {title}
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-accent px-1 text-[10px] font-medium text-sidebar-foreground/60">
            {entries.length}
          </span>
        </button>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            {hasActive ? (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-primary hover:underline"
              >
                {t("common.clear", "Clear")}
              </button>
            ) : null}
            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-primary hover:underline"
              >
                {showAll
                  ? t("common.collapse")
                  : `${t("common.showAll")} ${entries.length}`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto px-6 pb-3 scrollbar-hide animate-in fade-in slide-in-from-bottom-2 duration-smooth">
          {variant === "list" ? (
            <ul className="flex flex-col gap-0.5 pt-1">
              {visible.map((entry) => {
                const isActive = hasActive && entry.value === activeValue;
                return (
                  <li key={entry.value}>
                    <button
                      type="button"
                      onClick={() =>
                        isActive ? onClear() : onSelect(entry.value)
                      }
                      aria-pressed={isActive}
                      title={`${entry.label} (${entry.count})`}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors duration-base ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <span className="truncate">{entry.label}</span>
                      <span
                        className={`shrink-0 tabular-nums ${isActive ? "opacity-80" : "text-sidebar-foreground/40"}`}
                      >
                        {entry.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {visible.map((entry) => {
                const isActive = hasActive && entry.value === activeValue;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() =>
                      isActive ? onClear() : onSelect(entry.value)
                    }
                    aria-pressed={isActive}
                    title={`${entry.label} (${entry.count})`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-base ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-sidebar-accent text-sidebar-foreground/70 hover:bg-primary hover:text-white"
                    }`}
                  >
                    <span className="truncate max-w-[8rem]">{entry.label}</span>
                    <span className="opacity-70">{entry.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SidebarSkillNavigation({
  controller,
}: {
  controller: SidebarController;
}) {
  return (
    <div className="flex-shrink-0 flex flex-col px-3 py-2">
      <div className="space-y-1 shrink-0">
        <SidebarSkillPrimaryNavigation controller={controller} />
        <SidebarSkillPlatformNavigation controller={controller} />
        <SidebarSkillStoreNavigation controller={controller} />
      </div>
    </div>
  );
}

function useSkillViewNavigation(controller: SidebarController) {
  const openView = (view: "my-skills" | "projects" | "agents") => () => {
    if (!controller.confirmLeaveDirtySkillEditor()) return;
    if (view === "my-skills") controller.setSkillFilterType("all");
    controller.setStoreView(view);
    controller.selectSkill(null);
    if (controller.currentPage !== "home") controller.onNavigate("home");
  };
  return openView;
}

function SidebarSkillPrimaryNavigation({
  controller,
}: {
  controller: SidebarController;
}) {
  const openView = useSkillViewNavigation(controller);
  return (
    <SidebarNavigationItem
      icon={<CuboidIcon className="w-5 h-5" />}
      label={controller.t("nav.mySkills", "我的 Skills")}
      count={controller.skills.length}
      active={
        (controller.storeView === "distribution" ||
          controller.storeView === "my-skills") &&
        controller.currentPage === "home"
      }
      collapsed={controller.isCollapsed}
      onClick={openView("my-skills")}
    />
  );
}

function SidebarSkillPlatformNavigation({
  controller,
}: {
  controller: SidebarController;
}) {
  const openView = useSkillViewNavigation(controller);
  if (!controller.runtimeCapabilities.skillLocalScan) return null;
  return (
    <>
      <SidebarNavigationItem
        icon={<FolderPlusIcon className="w-5 h-5" />}
        label={controller.t("nav.projects", "Projects")}
        count={controller.skillProjects.length}
        active={
          controller.storeView === "projects" &&
          controller.currentPage === "home"
        }
        collapsed={controller.isCollapsed}
        onClick={openView("projects")}
      />
      <SidebarNavigationItem
        icon={<BotIcon className="w-5 h-5" />}
        label={controller.t("nav.agentSkills", "Agent Skills")}
        count={controller.visibleSkillAgentCount}
        active={
          controller.storeView === "agents" && controller.currentPage === "home"
        }
        collapsed={controller.isCollapsed}
        onClick={openView("agents")}
      />
    </>
  );
}

function SidebarSkillStoreNavigation({
  controller,
}: {
  controller: SidebarController;
}) {
  if (!controller.runtimeCapabilities.skillStore) return null;
  return (
    <>
      <div className="h-px app-wallpaper-panel-strong-border/50 my-2" />
      <SidebarNavigationItem
        icon={<StoreIcon className="w-5 h-5" />}
        label={controller.t("nav.skillStore", "Skill 商店")}
        active={
          controller.storeView === "store" && controller.currentPage === "home"
        }
        collapsed={controller.isCollapsed}
        onClick={controller.handleSkillStoreNavClick}
      />
    </>
  );
}

interface SkillStoreSource {
  id: string;
  label: string;
  count?: number | string;
  enabled?: boolean;
  custom?: boolean;
}

function getBuiltInSkillSources(
  controller: SidebarController,
): SkillStoreSource[] {
  const sources: SkillStoreSource[] = [
    {
      id: "official",
      label: controller.t("skill.officialStore", "官方商店"),
      count: 0,
    },
    {
      id: "claude-code",
      label: controller.t("skill.claudeCodeStore", "Claude Code 商店"),
      count: controller.claudeCodeStoreCount,
    },
    {
      id: "openai-codex",
      label: controller.t("skill.openaiCodexStore", "OpenAI Codex 商店"),
      count: controller.openAiCodexStoreCount,
    },
    {
      id: "community",
      label: controller.t("skill.communityStore", "Community Store"),
      count: controller.communityStoreCount,
    },
    {
      id: "clawhub",
      label: controller.t("skill.clawHubStore", "ClawHub 商店"),
      count: controller.clawHubStoreCount,
    },
  ];
  if (controller.runtimeCapabilities.promptHubCloud) {
    sources.push({
      id: "prompthub-cloud",
      label: controller.t("skill.promptHubCloudStore", "AgentsHub Cloud"),
      count: controller.promptHubCloudStoreCount,
    });
  }
  return sources;
}

function getCustomSkillSources(
  controller: SidebarController,
): SkillStoreSource[] {
  return controller.customStoreSources.map((source) => ({
    id: source.id,
    label: source.name,
    count:
      getRemoteStoreSkillCount(controller.remoteStoreEntries[source.id]) ||
      undefined,
    enabled: source.enabled,
    custom: true,
  }));
}

function SidebarSkillStoreSourceButton({
  controller,
  source,
  isNew = false,
}: {
  controller: SidebarController;
  source: SkillStoreSource;
  isNew?: boolean;
}) {
  const selected = controller.selectedStoreSourceId === source.id;
  const className = isNew
    ? `w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm transition-colors ${selected ? "border-primary text-primary bg-primary/5" : "border-sidebar-border/70 text-sidebar-foreground/50 hover:border-primary/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/20"}`
    : `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selected ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"}`;
  return (
    <button
      type="button"
      onClick={() => controller.openSkillStoreSource(source.id)}
      className={className}
    >
      {isNew ? (
        <PlusIcon className="w-4 h-4" aria-hidden="true" />
      ) : source.custom ? (
        <LinkIcon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <StoreIcon className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="flex-1 text-left truncate">{source.label}</span>
      {source.count !== undefined ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-accent/80 text-sidebar-foreground/50 border border-white/5">
          {source.count}
        </span>
      ) : null}
      {source.enabled === false ? (
        <span className="text-[10px] text-sidebar-foreground/40">
          {controller.t("common.disabled", "停用")}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSkillStoreSources({
  controller,
}: {
  controller: SidebarController;
}) {
  if (
    !controller.runtimeCapabilities.skillStore ||
    !controller.isSkillStoreGroupExpanded ||
    controller.isCollapsed
  )
    return <div className="flex-1" />;
  const sources = [
    ...getBuiltInSkillSources(controller),
    ...getCustomSkillSources(controller),
  ];
  return (
    <div
      data-testid="skill-store-source-scroll"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 pb-3"
    >
      <div className="ml-4 mt-1 pl-3 pr-1 border-l border-sidebar-border/50 space-y-1">
        {sources.map((source) => (
          <SidebarSkillStoreSourceButton
            key={source.id}
            controller={controller}
            source={source}
          />
        ))}
        <SidebarSkillStoreSourceButton
          controller={controller}
          source={{
            id: "new-custom",
            label: controller.t("skill.addStoreSource", "添加商店"),
          }}
          isNew
        />
      </div>
    </div>
  );
}

export function SidebarSkillPanel({
  controller,
}: {
  controller: SidebarController;
}) {
  const isMySkillsView = controller.storeView === "my-skills";
  const sourceEntries = useSkillSourceEntries(controller.skills, controller.t);
  const authorEntries = useSkillAuthorEntries(controller.skills);
  return (
    <>
      <SidebarSkillNavigation controller={controller} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <SidebarSkillStoreSources controller={controller} />
        {isMySkillsView ? (
          <SidebarSkillFilterSection
            title={controller.t("skill.sourceFilterLabel", "Skill source")}
            entries={sourceEntries}
            activeValue={controller.skillFilterSourceKey}
            onSelect={(value) => {
              controller.setSkillFilterSourceKey(value);
              controller.setStoreView("my-skills");
            }}
            onClear={() => controller.setSkillFilterSourceKey("all")}
            isCollapsed={controller.isSkillSourceFilterCollapsed}
            setIsCollapsed={controller.setIsSkillSourceFilterCollapsed}
            showAll={controller.showAllSkillSources}
            setShowAll={controller.setShowAllSkillSources}
            t={controller.t}
          />
        ) : null}
        {isMySkillsView ? (
          <SidebarSkillFilterSection
            title={controller.t("skill.authorFilterLabel", "Author")}
            entries={authorEntries}
            activeValue={controller.skillFilterAuthor ?? "all"}
            onSelect={(value) => {
              controller.setSkillFilterAuthor(value);
              controller.setStoreView("my-skills");
            }}
            onClear={() => controller.setSkillFilterAuthor(null)}
            isCollapsed={controller.isSkillAuthorFilterCollapsed}
            setIsCollapsed={controller.setIsSkillAuthorFilterCollapsed}
            showAll={controller.showAllSkillAuthors}
            setShowAll={controller.setShowAllSkillAuthors}
            t={controller.t}
            variant="list"
          />
        ) : null}
        {controller.shouldShowSkillTags ? (
          <SidebarResourceTagPanel
            controller={controller}
            options={{
              activeTags: controller.skillFilterTags,
              clearTags: controller.clearSkillFilterTags,
              isSectionCollapsed: controller.isResourceTagsCollapsed,
              onManage: () => controller.setTagManagerScope("skill"),
              setIsSectionCollapsed: controller.setIsResourceTagsCollapsed,
              setShowAll: controller.setShowAllSkillTags,
              showAll: controller.showAllSkillTags,
              tags: controller.uniqueSkillTags,
              toggleTag: (tag) => {
                controller.toggleSkillFilterTag(tag);
                controller.setStoreView("my-skills");
              },
            }}
          />
        ) : null}
      </div>
    </>
  );
}
