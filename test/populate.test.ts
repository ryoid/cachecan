import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { describe, expect, test } from "vitest";
import { createCache } from "../src";

const storage = createStorage({
  driver: fsDriver({ base: "./test/tmp" }),
});

const [cache, { store }] = createCache({
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
  key: ["populate", "api-data"],
  maxAge: 60 * 60 * 24,
});

describe("populate", () => {
  test.sequential("should populate cache", async () => {
    await store(
      ["populate", "api-data"],
      {
        hello: "populated",
      },
      {
        // Optional, override cache default maxAge
        // 0.5 seconds
        maxAge: 0.5,
      },
    );
    const data = await getData();
    expect(data).toEqual({
      hello: "populated",
    });
  });
  test.sequential("should populated cache expire", async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const data = await getData();
    expect(data).toEqual({
      hello: "world",
    });
  });
});
