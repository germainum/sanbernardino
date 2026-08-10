import { describe, expect, it } from "vitest";
import { getRoutesProvider, getViasuisseProvider } from "../src/providers/index.js";
import { MockRoutesProvider, MockViasuisseProvider } from "../src/providers/mock.js";
import { RealRoutesProvider, RealViasuisseProvider } from "../src/providers/http.js";

describe("provider factory", () => {
  it("defaults to mock providers when DATA_SOURCE is unset", () => {
    expect(getViasuisseProvider({})).toBeInstanceOf(MockViasuisseProvider);
    expect(getRoutesProvider({})).toBeInstanceOf(MockRoutesProvider);
  });

  it("returns real providers when DATA_SOURCE=live and credentials are present", () => {
    const viasuisse = getViasuisseProvider({
      DATA_SOURCE: "live",
      VIASUISSE_API_BASE: "https://example.test",
      VIASUISSE_TOKEN_URL: "https://example.test/token",
      VIASUISSE_CLIENT_ID: "id",
      VIASUISSE_CLIENT_SECRET: "secret",
    });
    expect(viasuisse).toBeInstanceOf(RealViasuisseProvider);

    const routes = getRoutesProvider({ DATA_SOURCE: "live", GOOGLE_ROUTES_API_KEY: "key" });
    expect(routes).toBeInstanceOf(RealRoutesProvider);
  });

  it("fails fast when DATA_SOURCE=live but credentials are missing, instead of silently falling back to mock", () => {
    expect(() => getViasuisseProvider({ DATA_SOURCE: "live" })).toThrow();
    expect(() => getRoutesProvider({ DATA_SOURCE: "live" })).toThrow();
  });
});
