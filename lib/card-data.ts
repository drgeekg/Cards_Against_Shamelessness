// Central card data store — casts JSON imports to proper types
import type { ResponseCard, PromptCard } from "@/types/game";
import decencyRaw from "@/packs/decency/base.json";
import sanskaarRaw from "@/packs/sanskaar/base.json";

export const ALL_RESPONSES: ResponseCard[] = [
  ...decencyRaw.responses,
  ...sanskaarRaw.responses,
] as ResponseCard[];

export const ALL_PROMPTS: PromptCard[] = [
  ...decencyRaw.prompts,
  ...sanskaarRaw.prompts,
] as PromptCard[];

export function getCardById(id: string): ResponseCard | undefined {
  return ALL_RESPONSES.find((r) => r.id === id);
}

export function getPromptById(id: string): PromptCard | undefined {
  return ALL_PROMPTS.find((p) => p.id === id);
}
