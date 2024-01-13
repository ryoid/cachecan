import { describe, expect, test } from "vitest";
import { resolveKey } from "../src";

const CustomObj = {
  toString() {
    return "custom";
  },
};

describe("resolve keys", () => {
  test("single arg string", () => {
    const resolved = resolveKey("users");
    expect(resolved).toEqual("users.cache");
  });
  test("single arg number", () => {
    const resolved = resolveKey(2);
    expect(resolved).toEqual("2.cache");
  });
  test("single arg custom toString()", () => {
    const resolved = resolveKey(CustomObj);
    expect(resolved).toEqual("custom.cache");
  });

  test("array single arg", () => {
    const resolved = resolveKey(["users"]);
    expect(resolved).toEqual("users.cache");
  });

  test("array multiple arg", () => {
    const resolved = resolveKey(["users", 1, "profile", CustomObj]);
    expect(resolved).toEqual("users/1/profile/custom.cache");
  });
});
