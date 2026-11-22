import type {
  MeModelsResponse,
  ModelCategory,
  OpenCodeConfig,
  Provider,
  OpenCodeModel,
  MeModel,
} from "./types";
import { sampleResponse } from "./me";
import baseConfig from "./baseConfig";
import { writeFileSync } from "node:fs";

const BLACKLISTED_PROVIDERS: (keyof Provider)[] = ["UiO-Claude"];

const OUTPUT_FILE_NAME = "processed-opencode-config.json";

const getApiKeyName = (colour: string) => `GPT_UIO_${colour.toUpperCase()}_KEY`;
const getApiKeyByColour = (colour: string) =>
  process.env[getApiKeyName(colour)];

// @ts-expect-error: Object.fromEntries may not infer the correct type for Record<ModelCategory, string>
const API_KEY_NAMES: Record<ModelCategory, string> = Object.fromEntries(
  ["green", "yellow", "red"].map((colour) => [colour, getApiKeyName(colour)]),
);

// Vi vil utivde base model med alle modellene fra me.ts
// Problemet er at de ikke er på samme format som OpenCode.
// Så vi må transformere dem til OpenCode-formatet og så legge dem til en ny
// output-fil og skrive den til disk

const getModelsByCategory = (myModels: MeModelsResponse) =>
  Object.fromEntries(
    // TODO: Denne burde baseres på nøkler i CATEGORY_TO_PROVIDER_MAP i stedet for å
    // hardkode kategoriene?
    (["yellow", "red"] as ModelCategory[]).map((category) => [
      category,
      myModels.filter((model) => model.category === category),
    ]),
  );

const meModelToOpenCodeModel = (model: MeModel): [string, OpenCodeModel] => [
  model.model,
  {
    name: model.name,
    experimental: model.experimental,
    attachment: model.images,
    reasoning: model.reasoning,
    tool_call: !model.toolCallsDisabled,
    ...(model.depricated ? { status: "deprecated" as const } : {}),
    ...(model.responses ? { provider: { npm: "@ai-sdk/openai" } } : {}),
  },
];

const setApiKeyByColourAndProvider = (
  config: OpenCodeConfig,
  colour: "yellow" | "red",
  provider: keyof Provider,
) => {
  const resolvedEnvVar = getApiKeyByColour(colour);
  config.provider[provider].options.apiKey = resolvedEnvVar;
};

const setGreenClaudeAPIKey = (config: OpenCodeConfig) => {
  const resolvedAPIKey = getApiKeyByColour("green");
  config.provider["UiO-Claude"].options.headers.Authorization = resolvedAPIKey!;
};

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
