import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { describe, expect, test } from "vitest";
import { createCache, resolveKey } from "../src";

const storage = createStorage({
  driver: fsDriver({ base: "./test/tmp/purge" }),
});

const [cache, { store, purge }] = createCache({
  storage,
});

type Data = {
  hello: string;
};

function fetchData(id?: number): Promise<Data> {
  return new Promise((resolve) => {
    if (id === undefined) {
      return resolve({
        hello: "world",
      });
    }
    return resolve({
      hello: "world" + id,
    });
  });
}

const getData = cache(fetchData, {
  key: ["api-data"],
  maxAge: 60 * 60 * 24,
});

describe("purge", () => {
  test("should purge cache", async () => {
    // Store
    await store(["api-data", "1"], {
      hello: "purged",
    });
    // Get other data
    await getData();

    // Purge all
    await purge();

    // Get data again
    const keys = await storage.getKeys();
    expect(keys).toEqual([]);
  });
  test("should purge cache", async () => {
    const key = ["key", "api-data", "1"];
    // Store
    await store(key, {
      hello: "purged",
    });
    const valueStored = await storage.getItemRaw(resolveKey(key));
    expect(valueStored).not.toBeNull();

    // Purge key
    await purge(key);

    // Get data again
    const value = await storage.getItemRaw(resolveKey(key));
    expect(value).toBeNull();
  });
});
