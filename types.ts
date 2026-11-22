// ---- me endpoint response types

export type MeModelsResponse = MeModel[];

export type ModelCategory = "green" | "yellow" | "red";
export type MeModel = {
  model: string;
  name: string;
  // category: string;
  category: ModelCategory;
  experimental: boolean;
  images: boolean;
  tokenEncoding: string;
  reasoning: boolean;
  responses: boolean;
  toolCallsDisabled: boolean;
  inputCost: number;
  outputCost: number;
  depricated: boolean;
  maxTokens: number;
  serverName: string;
  domain: string;
};

export type ModelInput = Pick<
  MeModel,
  | "model"
  | "name"
  | "category"
  | "experimental"
  | "images"
  | "reasoning"
  | "responses"
  | "toolCallsDisabled"
  | "depricated" // TODO: Det er en typo i APIet, rip
>;

// --- OC (OpenCode) Models and Configurations

export type OpenCodeConfig = {
  $schema: string;
  disabled_providers: string[];
  provider: Provider;
};

type ModelModality = "text" | "audio" | "image" | "video" | "pdf";

type ModelCost = {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
};

type OpenCodeModelConfig = {
  id?: string;
  name?: string;
  family?: string;
  release_date?: string;
  attachment?: boolean;
  reasoning?: boolean;
  temperature?: boolean;
  tool_call?: boolean;
  interleaved?: boolean | string | { field: string };
  cost?: ModelCost & { context_over_200k?: ModelCost };
  limit?: { context: number; input?: number; output: number };
  modalities?: { input?: ModelModality[]; output?: ModelModality[] };
  experimental?: boolean;
  status?: "alpha" | "beta" | "deprecated" | "active";
  provider?: { npm?: string; api?: string };
  options?: Record<string, unknown>;
  headers?: Record<string, string>;
  variants?: Record<string, { disabled?: boolean; [option: string]: unknown }>;
};

export type OpenCodeModel = OpenCodeModelConfig & { name: string };

type OpenCodeProviderConfig = {
  api?: string;
  name?: string;
  env?: string[];
  id?: string;
  npm?: string;
  whitelist?: string[];
  blacklist?: string[];
  options?: {
    apiKey?: string;
    baseURL?: string;
    enterpriseUrl?: string;
    setCacheKey?: boolean;
    timeout?: number | false;
    headerTimeout?: number | false;
    chunkTimeout?: number | false;
    [option: string]: unknown;
  };
  models?: Record<string, OpenCodeModelConfig>;
};

type UiOProvider = OpenCodeProviderConfig & {
  npm: string;
  name: string;
  options: { baseURL: string; apiKey: string };
  models: Record<string, OpenCodeModel>;
};

type UiOClaude = OpenCodeProviderConfig & {
  npm: string;
  name: string;
  options: { baseURL: string; headers: { Authorization: string } };
  models: Record<string, OpenCodeModel>;
};

export type Provider = {
  "UiO red": UiOProvider;
  "UiO yellow": UiOProvider;
  "UiO-Claude": UiOClaude;
};
