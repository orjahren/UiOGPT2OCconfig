import type { MeModel, OpenCodeModel } from "./types";

export const getApiKeyName = (colour: string) =>
  `GPT_UIO_${colour.toUpperCase()}_KEY`;
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

// TODO: Confirm cost units and whether maxTokens is a context or output limit.
