import { Buffer } from "node:buffer";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  issueSolvedPromptHubCaptcha,
  normalizePromptHubWebBaseUrl,
} from "../../../src/renderer/services/self-hosted-auth";

const DIGIT_4_SIGNATURE =
  "MLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQZMLLQLLLQLLQLLQLLQLLQLLQLLLQLLLQLLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQZMLLQLLQLLQLLQLLQZ";
const DIGIT_7_SIGNATURE =
  "MLLQLLQLLLQLLQLLQLLQLLQLLLQLLQLLLQLLQLLQLLLQLLQLLQLLQLLQZMLLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLLLQLLQLLQLLQLLQLLLQLLLQLLQLLQLLLQZ";
const LOWERCASE_B_SIGNATURE =
  "MLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQZMLLQLLQLLQLLQLLLQLLQLLQLLQZMLLLQLLLLLQLLLQLLQLLQLLQLLQLLQZ";
const LOWERCASE_E_SIGNATURE =
  "MLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZ";

function signatureToPathData(signature: string, startX: number): string {
  let x = startX;
  let y = 0;

  return [...signature]
    .map((command) => {
      if (command === "M" || command === "L") {
        const pathCommand = `${command}${x} ${y}`;
        x += 1;
        y = (y + 1) % 5;
        return pathCommand;
      }

      if (command === "Q") {
        const pathCommand = `${command}${x} ${y} ${x + 1} ${y + 1} ${x + 2} ${y + 2}`;
        x += 3;
        y = (y + 2) % 5;
        return pathCommand;
      }

      if (command === "Z") {
        return "Z";
      }

      throw new Error(`Unsupported captcha path command: ${command}`);
    })
    .join("");
}

function buildSvgCaptchaImageData(signatures: string[]): string {
  const paths = signatures
    .map(
      (signature, index) =>
        `<path fill="#111" d="${signatureToPathData(signature, 10 + index * 120)}"></path>`,
    )
    .join("");
  const noise = '<path d="M5 5 C40 25, 80 0, 120 20" stroke="#ccc" fill="none"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80">${paths}${noise}</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("self-hosted-auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("solves svg captcha challenges returned by self-hosted auth", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          captchaId: "550e8400-e29b-41d4-a716-446655440000",
          imageData: buildSvgCaptchaImageData([
            DIGIT_4_SIGNATURE,
            DIGIT_7_SIGNATURE,
          ]),
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      issueSolvedPromptHubCaptcha("https://backup.example.com"),
    ).resolves.toEqual({
      captchaId: "550e8400-e29b-41d4-a716-446655440000",
      captchaAnswer: "47",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backup.example.com/api/auth/captcha",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it.each([
    ["https://backup.example.com/", "https://backup.example.com"],
    ["https://backup.example.com/api", "https://backup.example.com"],
    ["https://backup.example.com/api/", "https://backup.example.com"],
    [
      "https://backup.example.com/api/auth/captcha?refresh=1#top",
      "https://backup.example.com",
    ],
    [
      "https://backup.example.com/prompthub/api/auth/login",
      "https://backup.example.com/prompthub",
    ],
  ])("normalizes pasted AgentsHub Web URLs from %s", (input, expected) => {
    expect(normalizePromptHubWebBaseUrl(input)).toBe(expected);
  });

  it("reports a protected captcha endpoint as a URL/auth boundary error", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid Authorization header",
          },
        },
        { status: 401 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      issueSolvedPromptHubCaptcha("https://backup.example.com/api"),
    ).rejects.toThrow(
      "the captcha endpoint is requiring authentication",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backup.example.com/api/auth/captcha",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("solves lowercase svg captcha glyphs used by current web auth", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          captchaId: "660e8400-e29b-41d4-a716-446655440000",
          imageData: buildSvgCaptchaImageData([
            LOWERCASE_B_SIGNATURE,
            LOWERCASE_E_SIGNATURE,
          ]),
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      issueSolvedPromptHubCaptcha("https://backup.example.com"),
    ).resolves.toEqual({
      captchaId: "660e8400-e29b-41d4-a716-446655440000",
      captchaAnswer: "be",
    });
  });
});
