/* v8 ignore start */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { deserialize, serialize } from "seroval";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { CacheItem, createCache, resolveKey } from "../src";

const storage = createStorage({
  driver: fsDriver({ base: "./tmp" }),
});

const users = [];

storage.setItem(resolveKey("users"), {
  value: users,
  expires: Date.now() + 60 * 1000,
} satisfies CacheItem);

const [cache, { purge }] = createCache({
  storage,
  serialize,
  deserialize,
  defaults: {
    maxAge: 60 * 60 * 24,
  },
});
/* v8 ignore stop */
