import { GoogleGenAI } from "@google/genai";
import { StoryResponse } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export const callAIWithRotation = async (prompt: string, apiKeys: string[]): Promise<StoryResponse> => {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('No API keys configured. Please add an API key in Settings.');
  }

  let lastError: Error | null = null;

  // Try keys in order
  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    if (!key) continue;

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      // Clean up markdown code blocks if present (though responseMimeType should handle it)
      const cleanText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText) as StoryResponse;

    } catch (error: any) {
      console.warn(`API Key #${i + 1} failed:`, error);
      lastError = error;

      // If it's a quota error (429), continue to next key. Otherwise, maybe stop?
      // For now, we try rotation on most errors to be robust.
      if (error.message && (error.message.includes('quota') || error.message.includes('429'))) {
        continue;
      }
    }
  }

  throw new Error(`All API keys exhausted. Last error: ${lastError?.message || 'Unknown error'}`);
};

export const generateLessonPrompt = (text: string) => `
Translate Vietnamese to English.
Role: Native English speaker, perfect grammar.

RULES:
- Correct tenses, subject-verb agreement, articles, prepositions, natural word order.
- NO grammar errors.

Output JSON: {"sentences": [{"vi": "text", "en_best": "translation", "phrase_breakdown": [{"phrase": "phrase", "meaning": "meaning"}]}]}

Requirements:
1. Keep VI punctuation.
2. EN: Natural & Grammatically Perfect.
3. 3-5 phrase breakdowns/sentence.

Input: "${text}"
`;