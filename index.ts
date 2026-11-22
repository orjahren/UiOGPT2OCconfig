import type {
  MeModelsResponse,
  ModelCategory,
  OpenCodeConfig,
  Provider,
} from "./types";
import { sampleResponse } from "./me";
import baseConfig from "./baseConfig";
import {
  getModelsByCategory,
  meModelToOpenCodeModel,
  setGreenClaudeAPIKey,
} from "./utils";

import { writeFileSync } from "node:fs";

const BLACKLISTED_PROVIDERS: (keyof Provider)[] = ["UiO-Claude"];

const OUTPUT_FILE_NAME = "processed-opencode-config.json";

// TODO: Confirm the units for inputCost/outputCost before mapping to OpenCode cost.
// TODO: Confirm whether maxTokens means context window or maximum output.
const injectAdditionalModels = (
  baseConfig: OpenCodeConfig,
  myModels: MeModelsResponse,
): OpenCodeConfig => {
  const { yellow: yellowModels, red: redModels } =
    getModelsByCategory(myModels);
  const hydratedConfig = { ...baseConfig };
  const providers: [ModelCategory, "UiO yellow" | "UiO red"][] = [
    ["yellow", "UiO yellow"],
    ["red", "UiO red"],
  ];
  for (const [category, provider] of providers) {
    if (BLACKLISTED_PROVIDERS.includes(provider as keyof Provider)) {
      // Vi vil ikke røre Claude-ting...
      continue;
    }

    const meModels = category === "yellow" ? yellowModels : redModels;
    const existingModels = baseConfig.provider[provider].models;
    console.log("Existing models for", category, ":", existingModels);

    const convertedMeModels = Object.fromEntries(
      meModels.map(meModelToOpenCodeModel),
    );
    console.log("Converted models for", category, ":", convertedMeModels);

    const allModels = { ...existingModels, ...convertedMeModels };
    console.log("Merged models for", category, ":", allModels);

    const sortedModels = Object.fromEntries(
      Object.keys(allModels)
        .sort()
        .map((key) => [key, allModels[key]]),
    );

    hydratedConfig.provider[provider].models = sortedModels;

    // @ts-expect-error TODO: category funker dårlig fordi vi ikke håndterer Claude/green her
    setApiKeyByColourAndProvider(hydratedConfig, category, provider);
  }

  // Claude edge case :')
  // TODO: Burde gjøre dette som et steg i den generelle løkken over?
  setGreenClaudeAPIKey(hydratedConfig);

  return hydratedConfig;
};

const main = () => {
  const myModels = sampleResponse;
  const dirtyConfig = injectAdditionalModels(baseConfig, myModels);
  console.log("Dirty config generated:");
  console.log(dirtyConfig);
  console.log(JSON.stringify(dirtyConfig, null, 2));

  writeFileSync("./" + OUTPUT_FILE_NAME, JSON.stringify(dirtyConfig, null, 2));
  writeFileSync(
    // "~/.config/opencode/" + OUTPUT_FILE_NAME,
    "/home/oliverrj/.config/opencode/" + OUTPUT_FILE_NAME,
    JSON.stringify(dirtyConfig, null, 2),
  );
};
main();
