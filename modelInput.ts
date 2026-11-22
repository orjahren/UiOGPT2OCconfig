import type { ModelInput } from "./types";

export class ModelInputError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringField = (model: Record<string, unknown>, field: string, index: number): string => {
  const value = model[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new ModelInputError(`Model ${index}: ${field} must be a non-empty string.`);
  }
  return value;
};

const booleanField = (model: Record<string, unknown>, field: string, index: number): boolean => {
  const value = model[field];
  if (typeof value !== "boolean") {
    throw new ModelInputError(`Model ${index}: ${field} must be a boolean.`);
  }
  return value;
};

export const parseModelList = (input: string): ModelInput[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ModelInputError("Invalid JSON. Paste the model array from /api/user/me.");
    }
    throw error;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ModelInputError("Paste a non-empty JSON array of models, not the full user response.");
  }

  return parsed.map((item: unknown, i: number): ModelInput => {
    const index = i + 1;
    if (!isRecord(item)) {
      throw new ModelInputError(`Model ${index}: expected an object.`);
    }
    const category = stringField(item, "category", index);
    if (category !== "red" && category !== "yellow" && category !== "green") {
      throw new ModelInputError(`Model ${index}: category must be red, yellow, or green.`);
    }
    return {
      model: stringField(item, "model", index),
      name: stringField(item, "name", index),
      category,
      experimental: booleanField(item, "experimental", index),
      images: booleanField(item, "images", index),
      reasoning: booleanField(item, "reasoning", index),
      responses: booleanField(item, "responses", index),
      toolCallsDisabled: booleanField(item, "toolCallsDisabled", index),
      depricated: booleanField(item, "depricated", index),
    };
  });
};
