# 🗑️ cachecan

[![npm version][npm-version-src]][npm-version-href]
[![Codecov][codecov-src]][codecov-href]

Like a trashcan, but for your cache.

Wrap functions to cache results. Supports [_any storage_](#storage), such as Redis, MongoDB, Cloudflare KV, localStorage, and even your file system.

```bash
npm i cachecan
# or
pnpm i cachecan
```

```tsx
import { createCache } from 'cachecan'
const [cache] = createCache({
  storage,
})

// Usage
const cacheGetData = cache(getData, { key: "data" })
const data = await cacheGetData()

const cacheGetData = cache(
  async () => { ... },
  { key: "data", maxAge: 60, }
)
const data = await cacheGetOtherData()
```

## Batteries not included

`cachecan` is a [tiny](https://bundlephobia.com/package/cachecan) cache wrapper. It does not actually include a cache.

### The batteries included setup

If you want to get started quickly. You should read on to learn how to customize your cache first.

```bash
npm i cachecan seroval unstorage
# or
pnpm i cachecan seroval unstorage
```

```tsx
import { createCache } from "cachecan";
import { deserialize, serialize } from "seroval";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

const storage = createStorage({
  driver: fsDriver({ base: "./tmp" }),
});

const [cache] = createCache({
  storage,
  serialize,
  deserialize,
  defaults: {
    maxAge: 60,
  },
});
```

### Storage

The cache storage is powered by [`unstorage`](https://unstorage.unjs.io), which allows you to use any of their drivers.

File system storage is useful for dev environments, easily transition to a hosted storage when moving to production.

```tsx
import { Storage, createStorage } from "unstorage";
import cloudflareKVHTTPDriver from "unstorage/drivers/cloudflare-kv-http";
import fsDriver from "unstorage/drivers/fs";

const isProduction = process.env.NODE_ENV === "production";

const storage = createStorage({
  driver: isProduction
    ? cloudflareKVHTTPDriver({
        accountId: "my-account-id",
        namespaceId: "my-kv-namespace-id",
        apiToken: "supersecret-api-token",
      })
    : fsDriver({ base: "./tmp" }),
});
```

### Serializers

To keep library small it does not ship with any serializers, defaulting to `JSON.stringify` and `JSON.parse`. This is not sufficient for all use cases, so you can provide your own serializer.

I use [`seroval`](https://github.com/lxsmnsyc/seroval), here's a [list of more serializers](https://github.com/lxsmnsyc/seroval/tree/main/benchmark#libraries).

```tsx
import { deserialize, serialize } from "seroval";

const [cache] = createCache({
  storage,
  serialize,
  deserialize,
});
```

## Usage

### Purging the cache

The created cache has a `purge` method that can be used to clear the cache storage.

```tsx
import { createCache } from "cachecan";

const [cache, { purge }] = createCache({
  storage,
});
await purge("users");
await purge(["user", 1]);
// Purge all cached items
await purge();
```

### Populating the cache

The created cache has a `store` method that can be used to populate the cache storage. Useful to hydrate the cache with pre-existing data.

```tsx
const users = [
  {
    hello: "populated",
  },
];

const [cache, { store }] = createCache();

await store(
  // Key
  "users",
  // Value
  users,
  {
    // Optional, override cache default maxAge
    // 60 seconds
    maxAge: 60,
  },
);
```

## License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/cachecan?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/cachecan
[codecov-src]: https://img.shields.io/codecov/c/gh/ryoid/cachecan/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/ryoid/cachecan
