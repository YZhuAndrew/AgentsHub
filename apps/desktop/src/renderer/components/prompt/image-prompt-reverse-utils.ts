import type { AIConfig } from "../../services/ai";
import { resolveScenarioAIConfig } from "../../services/ai-defaults";
import type {
  AIModelConfig,
  ModelRouteDefaults,
  ScenarioModelDefaults,
} from "../../stores/settings.store";

interface ResolveImagePromptReverseConfigOptions {
  aiModels: AIModelConfig[];
  scenarioModelDefaults: ScenarioModelDefaults;
  modelRouteDefaults?: ModelRouteDefaults;
  aiProvider: string;
  aiApiProtocol: AIConfig["apiProtocol"];
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
}

export interface ImagePromptReverseContext {
  folderNames: string;
  tagsString: string;
}

export const IMAGE_PROMPT_REVERSE_SYSTEM_PROMPT =
  "You reverse-engineer reference images into production-ready image generation prompts. Return only strict JSON.";

export function resolveImagePromptReverseConfig({
  aiModels,
  scenarioModelDefaults,
  modelRouteDefaults,
  aiProvider,
  aiApiProtocol,
  aiApiKey,
  aiApiUrl,
  aiModel,
}: ResolveImagePromptReverseConfigOptions): AIConfig | null {
  return resolveScenarioAIConfig({
    aiModels,
    scenarioModelDefaults,
    modelRouteDefaults,
    scenario: "imageReverse",
    type: "chat",
    requiredCapability: "vision",
    allowLegacyFallback: false,
    aiProvider,
    aiApiProtocol,
    aiApiKey,
    aiApiUrl,
    aiModel,
  });
}

export function buildImagePromptReverseInstruction(
  userInstruction: string,
  context: ImagePromptReverseContext,
): string {
  const normalizedInstruction = userInstruction.trim();

  return `你是一名资深 AI 生图 Prompt 设计师。请根据用户提供的参考图片，反推出一份可直接保存到 AgentsHub 的 image Prompt，并只返回 JSON。

用户补充需求：
"""
${normalizedInstruction || "无补充需求，请主要依据图片内容反推。"}
"""

可用的文件夹列表：
${context.folderNames || "暂无文件夹"}

已知存在的标签（请优先复用这些标签）：
${context.tagsString}

请只返回以下 JSON 结构，不要输出 Markdown、解释或代码块：
{
  "title": "具体、可识别的标题，不超过20字，不要使用“图片提示词”等泛名",
  "promptType": "image",
  "systemPrompt": "",
  "userPrompt": "最终给生图模型使用的 Prompt 正文，必须完整、结构化、可直接执行，并保留少量 AgentsHub 变量占位符",
  "description": "一句话描述用途，不超过50字",
  "suggestedFolder": "推荐的文件夹名称，如果没有合适的则返回 null",
  "tags": ["2-5 个标签，优先使用已存在标签"]
}

生成要求：
- userPrompt 必须是生图提示词，而不是图片说明或图像 caption。
- 按图像可见信息组织：主体、动作/姿态、场景、构图、镜头/视角、光线、色彩、材质、风格、质量词。
- userPrompt 必须使用 3-5 个 AgentsHub 变量占位符，方便用户复用和智能变量填充；不要变量化所有细节。
- 优先使用这类变量名：{{subject}}、{{style}}、{{background}}、{{composition}}、{{lighting}}、{{color_palette}}、{{negative_prompt}}。
- 推荐把 userPrompt 写成可扫描的结构化段落或分号分组，而不是一整段无层次关键词堆叠。
- 对不确定信息使用视觉描述，不要臆测真实姓名、品牌、地点、艺术家姓名、版权角色或不可见背景。
- 如用户补充需求与图片冲突，以用户补充需求作为风格/用途方向，但不要歪曲图片主体。
- 如有必要，在 userPrompt 末尾加入 concise negative prompt / avoid 子句。
- 输出必须可直接粘贴到 Midjourney、Stable Diffusion、Flux 等生图模型中测试。
- 不要返回除 JSON 以外的任何内容。`;
}
