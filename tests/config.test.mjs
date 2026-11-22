import assert from "node:assert/strict";
import { test } from "node:test";
import baseConfig from "../dist/baseConfig.js";
import { createConfig } from "../dist/config.js";
import { sampleResponse } from "../dist/me.js";

test("selects providers, references keys, and leaves the base config unchanged", () => {
  const before = structuredClone(baseConfig);
  const result = createConfig(baseConfig, sampleResponse, ["red", "green"], false);
  assert.deepEqual(Object.keys(result.provider), ["UiO red", "UiO-Claude"]);
  assert.equal(result.provider["UiO red"].options.apiKey, "{env:GPT_UIO_RED_KEY}");
  assert.equal(
    result.provider["UiO-Claude"].options.headers.Authorization,
    "{env:GPT_UIO_GREEN_KEY}",
  );
  assert.deepEqual(baseConfig, before);
});

test("excludes deprecated models, including ones present in the base config", () => {
  const result = createConfig(baseConfig, sampleResponse, ["yellow", "red"], false);
  assert.equal(result.provider["UiO yellow"].models["gpt-4"], undefined);
  assert.equal(result.provider["UiO red"].models["gpt-oss-120b"], undefined);
  assert.equal(result.provider["UiO yellow"].models["gpt-6-luna"].name, "GPT 6 Luna");
});

test("includes deprecated models without disabling them", () => {
  const result = createConfig(baseConfig, sampleResponse, ["yellow"], true);
  const model = result.provider["UiO yellow"].models["gpt-4"];
  assert.equal(model.name, "GPT-4");
  assert.equal(model.status, undefined);
});
