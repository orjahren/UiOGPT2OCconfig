// ---- me endpoint response types

export type MeModelsResponse = MeModel[];

export type ModelCategory = "red" | "yellow";
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

// --- OC (OpenCode) Models and Configurations

export type OpenCodeConfig = {
  $schema: string;
  disabled_providers: string[];
  provider: Provider;
};

type Options = {
  baseURL: string;
  apiKey: string;
};

export type OpenCodeModel = {
  name: string;
  experimental?: boolean;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  status?: "alpha" | "beta" | "deprecated" | "active";
  provider?: {
    npm?: string;
    api?: string;
  };
};

type RedModels = Record<string, OpenCodeModel>;

type UiORed = {
  npm: string;
  name: string;
  options: Options;
  models: RedModels;
};

type YellowModels = Record<string, OpenCodeModel>;

type UiOYellow = {
  npm: string;
  name: string;
  options: Options;
  models: YellowModels;
};

// --- claude

type ClaudeHeaders = {
  Authorization: string;
};

type ClaudeOptions = {
  baseURL: string;
  headers: ClaudeHeaders;
};

type ClaudeModels = {
  "claude-fable-5": OpenCodeModel;
  "claude-haiku-4-5": OpenCodeModel;
  "claude-opus-4-8": OpenCodeModel;
  "claude-opus-5": OpenCodeModel;
  "claude-sonnet-4-6": OpenCodeModel;
  "claude-sonnet-5": OpenCodeModel;
};

type UiOClaude = {
  npm: string;
  name: string;
  options: ClaudeOptions;
  models: ClaudeModels;
};

export type Provider = {
  "UiO red": UiORed;
  "UiO yellow": UiOYellow;
  "UiO-Claude": UiOClaude;
};
