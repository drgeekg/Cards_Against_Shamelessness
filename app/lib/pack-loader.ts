import type { PromptCard, ResponseCard } from "@/types/game";
import decencyBaseData from "@/packs/decency/base.json";
import sanskaarBaseData from "@/packs/sanskaar/base.json";

interface PackData {
  prompts: PromptCard[];
  responses: ResponseCard[];
}

const packFiles: Record<string, PackData> = {
  "decency-base": decencyBaseData as unknown as PackData,
  "sanskaar-base": sanskaarBaseData as unknown as PackData,
};

export function loadPacks(
  activePackIds: string[],
  edition: "decency" | "sanskaar"
): { prompts: PromptCard[]; responses: ResponseCard[] } {
  const prompts: PromptCard[] = [];
  const responses: ResponseCard[] = [];

  for (const packId of activePackIds) {
    const pack = packFiles[packId];
    if (!pack) continue;
    prompts.push(...pack.prompts);
    responses.push(...pack.responses);
  }

  // Fallback: load default pack if nothing matched
  if (prompts.length === 0) {
    const defaultPack = packFiles[`${edition}-base`];
    if (defaultPack) {
      prompts.push(...defaultPack.prompts);
      responses.push(...defaultPack.responses);
    }
  }

  return { prompts, responses };
}

export function getPackMeta() {
  return [
    {
      id: "decency-base",
      name: "Base Set",
      edition: "decency",
      description: "General absurdist and dark humor.",
      nsfw: false,
      promptCount: decencyBaseData.prompts.length,
      responseCount: decencyBaseData.responses.length,
      emoji: "🖤",
    },
    {
      id: "sanskaar-base",
      name: "Base Set (Sanskaar)",
      edition: "sanskaar",
      description: "General desi humor — family, society, and surviving India.",
      nsfw: false,
      promptCount: sanskaarBaseData.prompts.length,
      responseCount: sanskaarBaseData.responses.length,
      emoji: "🇮🇳",
    },
  ];
}
