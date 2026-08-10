import { describe, expect, it } from "vitest";
import { parseDeeplink } from "./deeplink";

describe("parseDeeplink()", () => {
  it("extracts a valid direction", () => {
    expect(parseDeeplink("sanbernardino://home?dir=italie")).toEqual({ direction: "italie" });
    expect(parseDeeplink("sanbernardino://home?dir=suisse")).toEqual({ direction: "suisse" });
  });

  it("returns empty for a missing or invalid dir param", () => {
    expect(parseDeeplink("sanbernardino://home")).toEqual({});
    expect(parseDeeplink("sanbernardino://home?dir=nowhere")).toEqual({});
  });

  it("degrades to empty on a malformed URL instead of throwing", () => {
    expect(() => parseDeeplink("not a url")).not.toThrow();
    expect(parseDeeplink("not a url")).toEqual({});
  });
});
