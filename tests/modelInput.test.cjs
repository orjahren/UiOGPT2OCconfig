const assert = require("node:assert/strict");
const { test } = require("node:test");
const baseConfig = require("../dist/baseConfig").default;
const { createConfig } = require("../dist/config");
const { sampleResponse } = require("../dist/me");
const { ModelInputError, parseModelList } = require("../dist/modelInput");

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
