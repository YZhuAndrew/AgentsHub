import { beforeEach, describe, expect, it, vi } from "vitest";

const handleMock = vi.fn();
const runMock = vi.fn();
const createDependenciesMock = vi.fn().mockReturnValue({ db: "dependencies" });
const cleanupMock = vi.fn().mockResolvedValue(undefined);
const lifecycleConstructorMock = vi.fn(function LifecycleConstructor() {
  return { run: runMock };
});

vi.mock("electron", () => ({
  ipcMain: { handle: handleMock },
}));

vi.mock("../../../src/main/services/skill-package-lifecycle", () => ({
  SkillPackageLifecycleService: lifecycleConstructorMock,
}));

vi.mock("../../../src/main/services/skill-package-lifecycle-desktop", () => ({
  createDesktopSkillPackageLifecycleDependencies: createDependenciesMock,
  cleanupAbandonedSkillPackageOperations: cleanupMock,
}));

async function setup() {
  const [{ registerSkillPackageOperationHandlers }, { IPC_CHANNELS }] =
    await Promise.all([
      import("../../../src/main/ipc/skill/package-operation-handlers"),
      import("@prompthub/shared/constants/ipc-channels"),
    ]);
  const db = { getById: vi.fn() };
  registerSkillPackageOperationHandlers({ db } as never);
  const handler = handleMock.mock.calls.find(
    ([channel]) => channel === IPC_CHANNELS.SKILL_RUN_PACKAGE_OPERATION,
  )?.[1] as
    | ((event: unknown, request: unknown) => Promise<unknown>)
    | undefined;
  return { db, handler, IPC_CHANNELS };
}

describe("Skill package operation IPC", () => {
  beforeEach(() => {
    handleMock.mockClear();
    runMock.mockReset();
    createDependenciesMock.mockClear();
    cleanupMock.mockReset().mockResolvedValue(undefined);
    lifecycleConstructorMock.mockClear();
  });

  it("registers one lifecycle owner and returns its structured result", async () => {
    const completed = {
      status: "completed",
      operation: "install",
      skill: { id: "skill-1" },
    };
    runMock.mockResolvedValue(completed);
    const { db, handler } = await setup();
    const request = { operation: "install" };

    expect(handler).toBeTypeOf("function");
    await expect(handler!(makeEvent(), request)).resolves.toBe(completed);
    expect(createDependenciesMock).toHaveBeenCalledWith(db);
    expect(lifecycleConstructorMock).toHaveBeenCalledTimes(1);
    // No requestId in the request -> no progress emitter, run called once.
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0]).toBe(request);
    expect(cleanupMock).toHaveBeenCalledWith(db, { recoverAll: true });
  });

  it("forwards progress to the requesting renderer when requestId is present", async () => {
    runMock.mockImplementation(
      async (_request: unknown, options?: { emit?: (d: unknown) => void }) => {
        options?.emit?.({ phase: "staging", message: "cloning-repository" });
        return { status: "completed", operation: "install", skill: { id: "1" } };
      },
    );
    const { handler, IPC_CHANNELS } = await setup();
    const send = vi.fn();
    const request = { operation: "install", requestId: "req-abc-123" };

    await handler!(makeEvent(send), request);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    const [channel, payload] = send.mock.calls[0];
    expect(channel).toBe(IPC_CHANNELS.SKILL_PACKAGE_OPERATION_PROGRESS);
    expect(payload).toMatchObject({
      kind: "install",
      requestId: "req-abc-123",
      phase: "staging",
      message: "cloning-repository",
    });
  });

  it("does not emit progress when the request omits requestId", async () => {
    runMock.mockImplementation(
      async (_request: unknown, options?: { emit?: (d: unknown) => void }) => {
        options?.emit?.({ phase: "staging", message: "cloning-repository" });
        return { status: "completed", operation: "install", skill: { id: "1" } };
      },
    );
    const { handler } = await setup();
    const send = vi.fn();
    const request = { operation: "install" };

    await handler!(makeEvent(send), request);

    // emit is undefined, so lifecycle.run receives no options and send is never called.
    expect(send).not.toHaveBeenCalled();
    expect(runMock.mock.calls[0][1]).toBeUndefined();
  });

  it("keeps the IPC available when startup recovery cannot finish", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    cleanupMock.mockRejectedValueOnce(new Error("recovery unavailable"));
    runMock.mockResolvedValue({ status: "cancelled", operation: "install" });

    const { handler } = await setup();
    await Promise.resolve();

    expect(handler).toBeTypeOf("function");
    expect(warning).toHaveBeenCalledWith(
      "Failed to recover abandoned Skill package operations:",
      expect.any(Error),
    );
    warning.mockRestore();
  });
});

/** Build a minimal fake IpcMainInvokeEvent with an optional sender.send mock. */
function makeEvent(send?: (channel: string, ...args: unknown[]) => void): {
  sender: { id: number; send: (channel: string, ...args: unknown[]) => void };
} {
  return {
    sender: {
      id: 1,
      send: send ?? vi.fn(),
    },
  };
}
