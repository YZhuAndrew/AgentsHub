import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SKILL_PLATFORM_ORDER,
  SKILL_PLATFORMS,
} from "@prompthub/shared/constants/platforms";

test("DEFAULT_SKILL_PLATFORM_ORDER contains every registered platform exactly once", () => {
  const registryIds = SKILL_PLATFORMS.map((platform) => platform.id);
  const orderIds: string[] = [...DEFAULT_SKILL_PLATFORM_ORDER];

  // Every registry id must appear in the order array.
  for (const id of registryIds) {
    assert.ok(
      orderIds.includes(id),
      `DEFAULT_SKILL_PLATFORM_ORDER is missing "${id}"`,
    );
  }

  // No duplicates inside the order array.
  assert.equal(
    new Set(orderIds).size,
    orderIds.length,
    "DEFAULT_SKILL_PLATFORM_ORDER must not contain duplicates",
  );

  // Coverage must be complete so Settings and Skills sort consistently.
  assert.equal(orderIds.length, registryIds.length);
  assert.deepEqual(
    [...orderIds].sort(),
    [...registryIds].sort(),
  );
});
