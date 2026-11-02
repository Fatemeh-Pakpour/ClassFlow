import { describe, expect, it } from "vitest";
import { parseWebEnv } from "./env.schema";

const developmentEnv = {
  NODE_ENV: "development",
  AUTH0_SECRET: "a".repeat(64),
  APP_BASE_URL: "http://localhost:3000",
  AUTH0_DOMAIN: "classflow.eu.auth0.com",
  AUTH0_CLIENT_ID: "client-id",
  AUTH0_CLIENT_SECRET: "client-secret",
  AUTH0_AUDIENCE: "https://api.classflow.local",
};

const productionEnv = { ...developmentEnv, NODE_ENV: "production", APP_BASE_URL: "https://app.classflow.example" };

describe("parseWebEnv", () => {
  it("accepts a development configuration", () => {
    expect(parseWebEnv(developmentEnv)).toMatchObject({ APP_BASE_URL: ["http://localhost:3000"] });
  });

  it("accepts several comma-separated base URLs", () => {
    const env = parseWebEnv({ ...productionEnv, APP_BASE_URL: "https://a.example, https://b.example" });

    expect(env.APP_BASE_URL).toEqual(["https://a.example", "https://b.example"]);
  });

  it("names the missing AUTH0_AUDIENCE", () => {
    expect(() => parseWebEnv({ ...developmentEnv, AUTH0_AUDIENCE: undefined })).toThrow(/AUTH0_AUDIENCE/);
  });

  it("rejects a whitespace-only AUTH0_AUDIENCE", () => {
    expect(() => parseWebEnv({ ...developmentEnv, AUTH0_AUDIENCE: "  " })).toThrow(/AUTH0_AUDIENCE/);
  });

  it("lists every invalid variable in one error", () => {
    expect(() =>
      parseWebEnv({ ...developmentEnv, AUTH0_SECRET: "short", AUTH0_CLIENT_ID: undefined, APP_BASE_URL: "" }),
    ).toThrow(/AUTH0_SECRET[\s\S]*APP_BASE_URL[\s\S]*AUTH0_CLIENT_ID/);
  });

  it.each(["https://classflow.eu.auth0.com", "classflow.eu.auth0.com/", "localhost"])(
    "rejects %s as AUTH0_DOMAIN",
    (domain) => {
      expect(() => parseWebEnv({ ...developmentEnv, AUTH0_DOMAIN: domain })).toThrow(/AUTH0_DOMAIN/);
    },
  );

  it("requires https base URLs in production", () => {
    expect(() =>
      parseWebEnv({ ...productionEnv, APP_BASE_URL: "https://app.classflow.example,http://app.classflow.example" }),
    ).toThrow(/must use https[\s\S]*APP_BASE_URL\[1\]/);
  });

  it("allows http on localhost in production for local `next start`", () => {
    expect(() => parseWebEnv({ ...productionEnv, APP_BASE_URL: "http://localhost:3000" })).not.toThrow();
  });

  it("allows http base URLs outside production", () => {
    expect(() => parseWebEnv({ ...developmentEnv, APP_BASE_URL: "http://app.classflow.example" })).not.toThrow();
  });
});
