import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { describe, expect, test } from "vitest";
import { createCache } from "../src";

const storage = createStorage({
  driver: fsDriver({ base: "./test/tmp" }),
});

const [cache] = createCache({
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
  key: "api-data",
  maxAge: 60 * 60 * 24,
});

const getDataParam = cache(fetchData, {
  key: (params) => ["api-data", params],
  maxAge: 60 * 60 * 24,
});

describe("cache", () => {
  test("should get data", async () => {
    const data = await getData();
    expect(data).toEqual({
      hello: "world",
    });
  });
  test("should get data with param ", async () => {
    const data = await getDataParam(1);
    expect(data).toEqual({
      hello: "world" + 1,
    });
  });
});
