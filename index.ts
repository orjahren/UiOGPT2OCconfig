import { lstat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import baseConfig from "./baseConfig";
import { sampleResponse } from "./me";
import { createConfig, providerDetails } from "./config";
import type { ModelCategory } from "./types";
import { getApiKeyName } from "./utils";

const main = async () => {
  const prompts = await import("@clack/prompts");
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Interactive setup requires a terminal. Run make run in a terminal.");
  }

  prompts.intro("GPT UiO to OpenCode");
  prompts.note(
    (["red", "yellow", "green"] as const)
      .map((category) => {
        const name = getApiKeyName(category);
        return `${name}: ${process.env[name]?.trim() ? "set" : "not set"}`;
      })
      .join("\n"),
    "API key environment variables",
  );
  prompts.log.info("Using the bundled sample model list, not the live UiO API.");

  const providers = await prompts.multiselect<ModelCategory>({
    message: "Which providers should be included?",
    options: (["red", "yellow", "green"] as const).map((category) => ({
      value: category,
      label: providerDetails[category],
    })),
    initialValues: ["red", "yellow", "green"],
    required: true,
  });
  if (prompts.isCancel(providers)) {
    prompts.cancel("No config was written.");
    return;
  }

  const includeDeprecated = await prompts.confirm({
    message: "Include deprecated models in the model picker?",
    initialValue: false,
  });
  if (prompts.isCancel(includeDeprecated)) {
    prompts.cancel("No config was written.");
    return;
  }

  const output = await prompts.text({
    message: "Where should the generated config be written?",
    initialValue: "./processed-opencode-config.json",
    validate: (value) => (value?.trim() ? undefined : "Enter an output path."),
  });
  if (prompts.isCancel(output)) {
    prompts.cancel("No config was written.");
    return;
  }

  const trimmedOutput = output.trim();
  const path = trimmedOutput === "~"
    ? homedir()
    : trimmedOutput.startsWith("~/")
      ? join(homedir(), trimmedOutput.slice(2))
      : isAbsolute(trimmedOutput) ? trimmedOutput : resolve(trimmedOutput);

  let exists = false;
  try {
    await lstat(path);
    exists = true;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const config = createConfig(baseConfig, sampleResponse, providers, includeDeprecated);
  const missingKeys = providers
    .map(getApiKeyName)
    .filter((name) => !process.env[name]?.trim());
  const summary = providers.map((category) => {
    const name = providerDetails[category];
    return `${name}: ${Object.keys(config.provider[name]?.models ?? {}).length} models`;
  });
  summary.push(`Output: ${path}`);
  if (exists) summary.push("The existing file will be replaced.");
  prompts.note(summary.join("\n"), "Preview");
  if (missingKeys.length > 0) {
    prompts.log.warn(`Missing environment variables: ${missingKeys.join(", ")}`);
  }
  prompts.log.info("The output references environment variables; OpenCode must have them set.");
  prompts.log.info("OpenCode automatically loads opencode.json(c) only in supported config locations.");

  const confirmed = await prompts.confirm({
    message: exists ? "Replace this file?" : "Write this file?",
    initialValue: false,
  });
  if (prompts.isCancel(confirmed) || !confirmed) {
    prompts.cancel("No config was written.");
    return;
  }

  await writeFile(path, JSON.stringify(config, null, 2) + "\n", {
    encoding: "utf8",
    flag: exists ? "w" : "wx",
  });
  prompts.outro(`Config written to ${path}`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
