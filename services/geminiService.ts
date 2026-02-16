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
Translate Vietnamese to English. You are a native English speaker with perfect grammar.

CRITICAL GRAMMAR RULES - NO EXCEPTIONS:
- Use correct verb tenses (past/present/future)
- Subject-verb agreement (he/she/it + verb+s)
- Correct articles: a/an (indefinite), the (definite)
- Proper prepositions (on/in/at/to/for)
- Natural word order
- Check EVERY sentence for grammar errors before output

Output JSON: {"sentences": [{"vi": "text,", "en_best": "translation", "phrase_breakdown": [{"phrase": "phrase", "meaning": "nghĩa"}]}]}

Requirements:
1. Keep Vietnamese text with punctuation
2. English must be: GRAMMATICALLY PERFECT + sound natural
3. Break into 3-5 phrases with meanings

Example:
Input: "Mặt trời mọc lên từ từ trên ngôi làng yên tĩnh."
Output: {"sentences": [{"vi": "Mặt trời mọc lên từ từ trên ngôi làng yên tĩnh.", "en_best": "The sun rose slowly over the quiet village.", "phrase_breakdown": [{"phrase": "The sun", "meaning": "mặt trời"}, {"phrase": "rose slowly", "meaning": "mọc lên từ từ"}, {"phrase": "over the quiet village", "meaning": "trên ngôi làng yên tĩnh"}]}]}

Input: "${text}"
`;