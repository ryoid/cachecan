import { deserialize, serialize } from "seroval";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { describe, expect, test } from "vitest";
import { createCache } from "../src";

const storage = createStorage({
  driver: fsDriver({ base: "./test/tmp" }),
});

const [cache] = createCache({
  storage,
  serialize,
  deserialize,
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
  key: ["seroval", "api-data"],
  maxAge: 60 * 60 * 24,
});

const getDataParam = cache(fetchData, {
  key: (param) => ["seroval", "api-data", param],
  maxAge: 60 * 60 * 24,
});

const getComplexData = cache(
  () => {
    return {
      hello: "world",
      date: new Date("2024-01-13T22:42:50.749Z"),
    };
  },
  {
    key: ["seroval", "complex-data"],
    maxAge: 60 * 60 * 24,
  },
);

describe("cache with seroval", () => {
  test("should get data", async () => {
    const data = await getData();
    expect(data).toEqual({
      hello: "world",
    });
  });
  test("should get data with param", async () => {
    const data = await getDataParam(1);
    expect(data).toEqual({
      hello: "world" + 1,
    });
  });
  test("should get complex data", async () => {
    const data = await getComplexData();
    expect(data).toEqual({
      hello: "world",
      date: new Date("2024-01-13T22:42:50.749Z"),
    });
  });
});
