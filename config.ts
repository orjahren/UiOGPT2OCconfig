import type {
  MeModel,
  MeModelsResponse,
  ModelCategory,
  OpenCodeConfig,
  OpenCodeModel,
  Provider,
} from "./types";
import { getApiKeyName, meModelToOpenCodeModel } from "./utils";

export const providerDetails = {
  red: "UiO red",
  yellow: "UiO yellow",
  green: "UiO-Claude",
} as const satisfies Record<ModelCategory, keyof Provider>;

type GeneratedConfig = Omit<OpenCodeConfig, "provider"> & {
  provider: Partial<Provider>;
};

const mergeModels = (
  existing: Record<string, OpenCodeModel>,
  models: MeModel[],
  includeDeprecated: boolean,
): Record<string, OpenCodeModel> => {
  const result = { ...existing };
  for (const model of models) {
    if (model.depricated && !includeDeprecated) {
      delete result[model.model];
      continue;
    }
    const [id, converted] = meModelToOpenCodeModel(model);
    if (includeDeprecated) delete converted.status;
    result[id] = converted;
  }
  for (const [id, model] of Object.entries(result)) {
    if (model.status !== "deprecated") continue;
    if (includeDeprecated) {
      const { status, ...enabled } = model;
      result[id] = enabled;
    } else {
      delete result[id];
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
};

export const createConfig = (
  base: OpenCodeConfig,
  models: MeModelsResponse,
  categories: ModelCategory[],
  includeDeprecated: boolean,
): GeneratedConfig => {
  const config: GeneratedConfig = { ...base, provider: {} };
  for (const category of categories) {
    const keyReference = `{env:${getApiKeyName(category)}}`;
    if (category === "green") {
      const provider = base.provider["UiO-Claude"];
      config.provider["UiO-Claude"] = {
        ...provider,
        options: {
          ...provider.options,
          headers: { ...provider.options.headers, Authorization: keyReference },
        },
        models: mergeModels(provider.models, [], includeDeprecated),
      };
    } else {
      const name = providerDetails[category];
      const provider = base.provider[name];
      config.provider[name] = {
        ...provider,
        options: { ...provider.options, apiKey: keyReference },
        models: mergeModels(
          provider.models,
          models.filter((model) => model.category === category),
          includeDeprecated,
        ),
      };
    }
  }
  return config;
};
