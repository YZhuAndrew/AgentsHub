import { describe, expect, it } from "vitest";

import {
  buildImagePromptReverseInstruction,
  resolveImagePromptReverseConfig,
} from "../../../src/renderer/components/prompt/image-prompt-reverse-utils";

describe("image-prompt-reverse-utils", () => {
  it("prefers the image reverse scenario chat model over legacy AI config", () => {
    const config = resolveImagePromptReverseConfig({
      aiModels: [
        {
          id: "generic-chat",
          type: "chat",
          provider: "openai",
          apiKey: "generic-key",
          apiUrl: "https://generic.example.com/v1",
          model: "gpt-4o-mini",
          apiProtocol: "openai",
          isDefault: true,
        },
        {
          id: "vision-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "vision-key",
          apiUrl: "https://vision.example.com/v1",
          model: "gpt-4o",
          capabilities: { vision: true },
        },
      ],
      scenarioModelDefaults: {
        imageReverse: "generic-chat",
      },
      modelRouteDefaults: {
        visionText: "vision-chat",
      },
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://legacy.example.com/v1",
      aiModel: "legacy-model",
    });

    expect(config).toMatchObject({
      provider: "openai",
      apiKey: "vision-key",
      apiUrl: "https://vision.example.com/v1",
      model: "gpt-4o",
      type: "chat",
    });
  });

  it("does not route image reverse to a normal chat model or legacy text config", () => {
    const config = resolveImagePromptReverseConfig({
      aiModels: [
        {
          id: "generic-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "generic-key",
          apiUrl: "https://generic.example.com/v1",
          model: "gpt-4o-mini",
          isDefault: true,
        },
      ],
      scenarioModelDefaults: {
        imageReverse: "generic-chat",
      },
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://legacy.example.com/v1",
      aiModel: "legacy-model",
    });

    expect(config).toBeNull();
  });

  it("ignores a non-vision route target and falls back to a configured vision chat model", () => {
    const config = resolveImagePromptReverseConfig({
      aiModels: [
        {
          id: "generic-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "generic-key",
          apiUrl: "https://generic.example.com/v1",
          model: "gpt-4o-mini",
          isDefault: true,
        },
        {
          id: "vision-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "vision-key",
          apiUrl: "https://vision.example.com/v1",
          model: "gpt-4o",
          capabilities: { vision: true },
        },
      ],
      scenarioModelDefaults: {
        imageReverse: "generic-chat",
      },
      modelRouteDefaults: {
        visionText: "generic-chat",
      },
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://legacy.example.com/v1",
      aiModel: "legacy-model",
    });

    expect(config).toMatchObject({
      provider: "openai",
      apiKey: "vision-key",
      model: "gpt-4o",
      type: "chat",
    });
  });

  it("uses a configured vision chat model even when the vision route is not explicit", () => {
    const config = resolveImagePromptReverseConfig({
      aiModels: [
        {
          id: "vision-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "vision-key",
          apiUrl: "https://vision.example.com/v1",
          model: "gpt-4o",
          capabilities: { vision: true },
        },
      ],
      scenarioModelDefaults: {},
      modelRouteDefaults: {},
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://legacy.example.com/v1",
      aiModel: "legacy-model",
    });

    expect(config).toMatchObject({
      apiKey: "vision-key",
      model: "gpt-4o",
    });
  });

  it("rejects an incomplete vision chat model instead of falling back to legacy text config", () => {
    const config = resolveImagePromptReverseConfig({
      aiModels: [
        {
          id: "broken-vision-chat",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "",
          apiUrl: "https://vision.example.com/v1",
          model: "gpt-4o",
          capabilities: { vision: true },
        },
      ],
      scenarioModelDefaults: {},
      modelRouteDefaults: {
        visionText: "broken-vision-chat",
      },
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://legacy.example.com/v1",
      aiModel: "legacy-model",
    });

    expect(config).toBeNull();
  });

  it("builds a strict production image prompt reverse instruction", () => {
    const prompt = buildImagePromptReverseInstruction(
      "Make it suitable for photorealistic product shots",
      {
        folderNames: "Image, Marketing",
        tagsString: "image, product",
      },
    );

    expect(prompt).toContain("Make it suitable for photorealistic product shots");
    expect(prompt).toContain('"promptType": "image"');
    expect(prompt).toContain('"userPrompt"');
    expect(prompt).toContain("不是图片说明或图像 caption");
    expect(prompt).toContain("3-5 个 AgentsHub 变量占位符");
    expect(prompt).toContain("{{subject}}");
    expect(prompt).toContain("{{style}}");
    expect(prompt).toContain("主体、动作/姿态、场景、构图");
    expect(prompt).toContain("不要臆测真实姓名、品牌");
    expect(prompt).toContain("Midjourney、Stable Diffusion、Flux");
  });
});
