import assert from "node:assert/strict";
import { test } from "node:test";
import baseConfig from "../dist/baseConfig.js";
import { createConfig } from "../dist/config.js";
import { sampleResponse } from "../dist/me.js";
import { ModelInputError, parseModelList } from "../dist/modelInput.js";

test("bundled sample contains only the metadata needed for conversion", () => {
  assert.deepEqual(parseModelList(JSON.stringify(sampleResponse)), sampleResponse);
});

test("parses pasted model data and uses it to generate config", () => {
  const model = {
    ...sampleResponse.find((item) => item.category === "yellow"),
    model: "custom-model",
    name: "Custom model",
    privateExtra: "not copied",
  };
  const parsed = parseModelList(JSON.stringify([model], null, 2));
  assert.equal(parsed[0].privateExtra, undefined);
  const config = createConfig(baseConfig, parsed, ["yellow"], false);
  assert.equal(config.provider["UiO yellow"].models["custom-model"].name, "Custom model");
});

test("rejects malformed, empty and full-user JSON", () => {
  for (const input of ["[", "[]", '{"models": []}']) {
    assert.throws(() => parseModelList(input), ModelInputError);
  }
});

test("rejects invalid metadata rather than generating incorrect capabilities", () => {
  const model = sampleResponse[0];
  assert.throws(
    () => parseModelList(JSON.stringify([{ ...model, toolCallsDisabled: "false" }])),
    /Model 1: toolCallsDisabled must be a boolean/,
  );
  assert.throws(
    () => parseModelList(JSON.stringify([{ ...model, category: "blue" }])),
    /category must be red, yellow, or green/,
  );
  assert.throws(
    () => parseModelList(JSON.stringify([{ ...model, name: "" }])),
    /name must be a non-empty string/,
  );
});

test("rejects non-model entries and identifies the failing model", () => {
  for (const invalid of [null, [], "model", 1]) {
    assert.throws(
      () => parseModelList(JSON.stringify([sampleResponse[0], invalid])),
      /Model 2: expected an object/,
    );
  }
});

test("requires every conversion field with the correct type", () => {
  const model = sampleResponse[0];
  for (const field of ["model", "name", "category"]) {
    for (const value of ["  ", 1, null]) {
      assert.throws(
        () => parseModelList(JSON.stringify([{ ...model, [field]: value }])),
        new RegExp(`Model 1: ${field} must be a non-empty string`),
      );
    }
  }
  for (const field of [
    "experimental", "images", "reasoning", "responses", "toolCallsDisabled", "depricated",
  ]) {
    for (const value of [undefined, "false", 0, null]) {
      assert.throws(
        () => parseModelList(JSON.stringify([{ ...model, [field]: value }])),
        new RegExp(`Model 1: ${field} must be a boolean`),
      );
    }
  }
});
