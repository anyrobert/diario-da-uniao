import { assertEquals } from "@std/assert";
import { FileSystemCache } from "../src/services/cache.ts";

const TEST_CACHE_DIR = ".test_cache";
const hasReadPermission = (await Deno.permissions.query({ name: "read" })).state === "granted";
const hasWritePermission = (await Deno.permissions.query({ name: "write" })).state === "granted";

Deno.test({
  name: "FileSystemCache",
  ignore: !hasReadPermission || !hasWritePermission,
  async fn(t) {
  const cache = new FileSystemCache(TEST_CACHE_DIR);
  const testData = { test: "data" };

  // Clean up test directory before and after tests
  await t.step("setup", async () => {
    try {
      await Deno.remove(TEST_CACHE_DIR, { recursive: true });
    } catch {
      // Directory might not exist, ignore error
    }
  });

  await t.step("should cache and retrieve data", async () => {
    await cache.set("test-key", testData);
    const retrieved = await cache.get("test-key");
    assertEquals(retrieved, testData);
  });

  await t.step("should return null for non-existent key", async () => {
    const retrieved = await cache.get("non-existent-key");
    assertEquals(retrieved, null);
  });

  await t.step("should handle invalid JSON", async () => {
    await Deno.mkdir(TEST_CACHE_DIR, { recursive: true });
    await Deno.writeTextFile(
      `${TEST_CACHE_DIR}/invalid.json`,
      "invalid json"
    );
    const retrieved = await cache.get("invalid");
    assertEquals(retrieved, null);
  });

  await t.step("cleanup", async () => {
    try {
      await Deno.remove(TEST_CACHE_DIR, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });
  },
});