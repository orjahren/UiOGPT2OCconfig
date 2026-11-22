import type {
  MeModelsResponse,
  ModelCategory,
  MeModel,
  OpenCodeModel,
  OpenCodeConfig,
  Provider,
} from "./types";

export const getApiKeyName = (colour: string) =>
  `GPT_UIO_${colour.toUpperCase()}_KEY`;
export const getApiKeyByColour = (colour: string) =>
  process.env[getApiKeyName(colour)];

// @ts-expect-error: Object.fromEntries may not infer the correct type for Record<ModelCategory, string>
const API_KEY_NAMES: Record<ModelCategory, string> = Object.fromEntries(
  ["green", "yellow", "red"].map((colour) => [colour, getApiKeyName(colour)]),
);

// Vi vil utivde base model med alle modellene fra me.ts
// Problemet er at de ikke er på samme format som OpenCode.
// Så vi må transformere dem til OpenCode-formatet og så legge dem til en ny
// output-fil og skrive den til disk

export const getModelsByCategory = (myModels: MeModelsResponse) =>
  Object.fromEntries(
    // TODO: Denne burde baseres på nøkler i CATEGORY_TO_PROVIDER_MAP i stedet for å
    // hardkode kategoriene?
    (["yellow", "red"] as ModelCategory[]).map((category) => [
      category,
      myModels.filter((model) => model.category === category),
    ]),
  );

export const meModelToOpenCodeModel = (
  model: MeModel,
): [string, OpenCodeModel] => [
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

export const setApiKeyByColourAndProvider = (
  config: OpenCodeConfig,
  colour: "yellow" | "red",
  provider: keyof Provider,
) => {
  const resolvedEnvVar = getApiKeyByColour(colour);
  config.provider[provider].options.apiKey = resolvedEnvVar;
};

export const setGreenClaudeAPIKey = (config: OpenCodeConfig) => {
  const resolvedAPIKey = getApiKeyByColour("green");
  config.provider["UiO-Claude"].options.headers.Authorization = resolvedAPIKey!;
};
