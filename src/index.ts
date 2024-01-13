import { type Storage } from "unstorage";

type NoInfer<T> = [T][T extends any ? 0 : never];

type CacheKey = string | (unknown & { toString(): string });

type KeyReturn = CacheKey | CacheKey[];

export type CacheItem<T = any> = {
  /**
   * Cached value
   */
  value: T;
  /**
   * Expiration timestamp in milliseconds
   */
  expires: number;
};

export type DefaultConfig = {
  /**
   * Time to live in seconds
   * @default 5 Minutes
   */
  maxAge?: number;
};

const FIVE_MINUTES_SEC = 60 * 5;

const DEFAULTS = {
  maxAge: FIVE_MINUTES_SEC,
} satisfies DefaultConfig;

export type CacheConfig = {
  /**
   * Cache storage
   */
  storage: Storage<string>;
  /**
   * Serializer
   * @default JSON.stringify
   */
  serialize?: <T = unknown>(source: CacheItem<T>) => string;
  /**
   * Deserializer
   * @default JSON.parse
   */
  deserialize?: <T = unknown>(source: string) => CacheItem<T>;
  /**
   * Default configuration
   */
  defaults?: DefaultConfig;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type CacheOptions<T, P extends any[]> = {
  /**
   * Key to use for caching. Can be a single or array of {@link CacheKey}
   *
   * If a function is provided, it will be called with the parameters passed to the cached function
   *
   * @example
   * { key: "profile" }
   * { key: ["user", "profile"] }
   * cache(
   *  async (id: number) => { ... },
   *  { key: (id) => ["user", id] }
   *       // ^? number
   * )
   * { key: (id) => "profile" + id }
   */
  key: KeyReturn | ((...params: NoInfer<P>) => KeyReturn);
  /**
   * Time to live in seconds
   *
   * When undefined uses {@link CacheConfig} default maxAge, defaults to 5 minutes
   */
  maxAge?: number;
};

export type CacheActions = {
  /**
   * Remove a cached item or purge all cached items.
   *
   * If **no key** is provided, **all cached items will be removed**
   *
   * @param key - Key to remove
   *
   * @example
   * cache.purge("user")
   * cache.purge(["user", "profile"])
   * // Purge all cached items
   * cache.purge()
   */
  purge: (key?: KeyReturn) => Promise<void>;
  /**
   * Store a value in the cache.
   *
   * @param key - Key to store
   * @param value - Value to store
   * @param options - Cache options {@link CacheOptions}
   *
   * @example
   * cache.store(
   *   ["user", "profile"],
   *   { name: "John Doe" },
   *   {
   *     // Optionally, override cache default maxAge
   *     // 60 seconds
   *     maxAge: 60
   *   }
   * )
   */
  store: <T>(
    key: KeyReturn,
    value: T,
    options?: Pick<CacheOptions<T, any>, "maxAge">,
  ) => Promise<void>;
};

/**
 * Resolve a key to a string, used as a key for the cache storage
 */
export function resolveKey(key: KeyReturn): string {
  // add extension to prevent collisions with directory names for fs
  return (Array.isArray(key) ? key.join("/") : key.toString()) + ".cache";
}

/**
 * Calculate relative expiry timestamp
 */
function expiry(maxAge: number) {
  return Date.now() + maxAge * 1000;
}

/**
 * Create a cache wrapper function
 *
 * @example
 * const [cache, { purge }] = createCache({
 *  storage,
 * })
 * const getUser = cache(fetchUser, {
 *   key: (id) => ["user", id]
 * })
 * const user = await getUser(1)
 */
export function createCache(config: CacheConfig) {
  const serialize =
    config.serialize ?? (JSON.stringify as <T>(source: CacheItem<T>) => string);
  const deserialize =
    config.deserialize ?? (JSON.parse as <T>(source: string) => CacheItem<T>);
  const defaultMaxAge = config.defaults?.maxAge ?? DEFAULTS.maxAge;

  /**
   * Wrap a function with a cache
   *
   * @param work - Function to cache
   * @param options - Cache options {@link CacheOptions}
   * @returns Cached function
   */
  function cache<T, P extends any[]>(
    /**
     * Function to cache
     */
    work: ((...params: P) => Promise<T>) | ((...params: P) => T), // Updated the 'work' parameter to accept parameters
    options: CacheOptions<T, P>,
  ) {
    return async (...params: P) => {
      // Evaluate the key to a string
      const evalKey: string | string[] =
        typeof options.key === "function"
          ? options.key(...params).map((k: KeyReturn) => k.toString())
          : options.key;
      const resolvedKey = resolveKey(evalKey);
      // Retrieve the cached item and use if not expired
      const cached = await config.storage.getItemRaw<string>(resolvedKey);
      const cachedItem = cached && deserialize<T>(cached);
      if (cachedItem && cachedItem.expires > Date.now()) {
        return cachedItem.value;
      }
      const value = await work(...params); // Invoke the 'work' function with the received parameters
      const item = {
        value,
        expires: expiry(options.maxAge ?? defaultMaxAge),
      } satisfies CacheItem<T>;
      // Store
      await config.storage.setItemRaw(resolvedKey, serialize(item));
      return value;
    };
  }

  const purge: CacheActions["purge"] = (key) => {
    if (key === undefined) {
      return config.storage.clear();
    }
    const resolvedKey = resolveKey(key);
    return config.storage.removeItem(resolvedKey);
  };

  const store: CacheActions["store"] = (key, value, options) => {
    const resolvedKey = resolveKey(key);
    const item = {
      value,
      expires: expiry(options?.maxAge ?? defaultMaxAge),
    } satisfies CacheItem;
    return config.storage.setItemRaw(resolvedKey, serialize(item));
  };

  return [
    cache,
    {
      purge,
      store,
    } as CacheActions,
  ] as const;
}
