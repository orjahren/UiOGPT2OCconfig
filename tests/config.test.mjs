import assert from "node:assert/strict";
import { test } from "node:test";
import baseConfig from "../dist/baseConfig.js";
import { createConfig } from "../dist/config.js";
import { sampleResponse } from "../dist/me.js";

const model = {
  model: "test-model",
  name: "Test model",
  category: "yellow",
  experimental: true,
  images: true,
  reasoning: true,
  responses: true,
  toolCallsDisabled: true,
  depricated: false,
};

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

test("maps capabilities, the technical ID and Responses provider to OpenCode", () => {
  const result = createConfig(baseConfig, [model], ["yellow"], false);
  assert.deepEqual(result.provider["UiO yellow"].models["test-model"], {
    name: "Test model",
    experimental: true,
    attachment: true,
    reasoning: true,
    tool_call: false,
    provider: { npm: "@ai-sdk/openai" },
  });

  const compatible = {
    ...model,
    experimental: false,
    images: false,
    reasoning: false,
    responses: false,
    toolCallsDisabled: false,
  };
  const other = createConfig(baseConfig, [compatible], ["yellow"], false);
  assert.deepEqual(other.provider["UiO yellow"].models["test-model"], {
    name: "Test model",
    experimental: false,
    attachment: false,
    reasoning: false,
    tool_call: true,
  });
});

test("only merges models into their selected category, replacing matching base entries", () => {
  const base = structuredClone(baseConfig);
  base.provider["UiO yellow"].models["test-model"] = { name: "Old name" };
  const redModel = { ...model, model: "red-only", category: "red" };
  const greenModel = { ...model, model: "green-ignored", category: "green" };
  const result = createConfig(base, [model, redModel, greenModel], ["yellow", "red", "green"], false);
  assert.equal(result.provider["UiO yellow"].models["test-model"].name, "Test model");
  assert.equal(result.provider["UiO yellow"].models["red-only"], undefined);
  assert.equal(result.provider["UiO red"].models["red-only"].name, "Test model");
  assert.equal(result.provider["UiO-Claude"].models["green-ignored"], undefined);
  assert.equal(base.provider["UiO yellow"].models["test-model"].name, "Old name");
});

test("filters and restores deprecated models already in the base config", () => {
  const base = structuredClone(baseConfig);
  base.provider["UiO-Claude"].models["old-claude"] = {
    name: "Old Claude",
    status: "deprecated",
  };
  const excluded = createConfig(base, [], ["green"], false);
  const included = createConfig(base, [], ["green"], true);
  assert.equal(excluded.provider["UiO-Claude"].models["old-claude"], undefined);
  assert.deepEqual(included.provider["UiO-Claude"].models["old-claude"], {
    name: "Old Claude",
  });
  assert.equal(base.provider["UiO-Claude"].models["old-claude"].status, "deprecated");
});
