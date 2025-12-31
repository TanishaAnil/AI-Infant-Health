
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

/**
 * Optimized System Instruction for gemini-3-flash-preview
 * Focuses on high-speed translation and clinical accuracy.
 */
const getSystemInstruction = (profile: InfantProfile) => {
  const docContext = REFERENCE_DOCS.map(d => `${d.title}: ${d.description}`).join('\n');

  return `You are a Pediatric Health Assistant performing as a Cross-Lingual Clinical Bridge.

CORE CAPABILITIES:
1. Translate Telugu/English inputs into clinical English terms internally.
2. Use provided documents and Google Search (in English) to find pediatric evidence.
3. Synthesize findings into empathetic, natural ${profile.language === 'te' ? 'Telugu' : 'English'}.

KNOWLEDGE BASE:
${docContext}

SAFETY PROTOCOLS:
- If symptoms like fever, lethargy, or breathing issues are mentioned, check "Red Flags" immediately.
- For a ${profile.weight}kg infant, advise professional consultation for dosages.
- Maintain a calm, professional tone. Avoid self-branding names.`;
};

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Main RAG and Translation Pipeline
 */
export const generateHealthInsight = async (
  logs: LogEntry[], 
  query: string, 
  profile: InfantProfile, 
  chatHistory: string
): Promise<AIResponse> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Format logs for context
    const logSummary = logs.slice(0, 8).map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `[${time}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[CONTEXT]
Infant: ${profile.name} (${profile.weight}kg)
Recent Vitals:
${logSummary}

[CONVERSATION HISTORY]
${chatHistory.slice(-1000)}

[PARENT QUERY]
"${query}"

[TASK]
1. Map intent to clinical evidence.
2. Search web if recent data is needed.
3. Respond in ${profile.language === 'te' ? 'Telugu script' : 'English'}.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
            topP: 0.8,
            topK: 40
        }
    });
    
    const text = response.text || "I'm having trouble analyzing the data right now.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Health Insight Error:", error);
    const isTe = profile.language === 'te';
    return { 
      text: isTe 
        ? "⚠️ కనెక్షన్ ఇబ్బంది. దయచేసి మళ్ళీ ప్రయత్నించండి." 
        : "⚠️ Connection error. Please try your request again in a moment.", 
      sources: [] 
    };
  }
};

/**
 * Generates dynamic follow-up suggestions based on context
 */
export const generateDynamicSuggestions = async (history: string, logs: LogEntry[], language: 'en' | 'te'): Promise<string[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return [];
    
    const ai = new GoogleGenAI({ apiKey });
    const latestLogs = logs.slice(0, 2).map(l => l.type).join(', ');
    
    const prompt = `Suggest 4 short follow-up questions a parent would ask next. 
    Context: ${history.slice(-500)}
    Recent activity: ${latestLogs}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          systemInstruction: `Suggest relevant, brief questions in ${language === 'te' ? 'Telugu' : 'English'}. No long sentences.`
      }
    });
    
    try {
      const result = JSON.parse(response.text || "[]");
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  } catch (error) {
    return [];
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || logs.length === 0) return "";
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Summarize ${profile.name}'s status briefly in ${profile.language === 'te' ? 'Telugu' : 'English'}. Logs: ${JSON.stringify(logs.slice(0, 2))}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "Pediatric summary agent. 2 sentences max. Plain text." 
      }
    });
    return response.text || "";
  } catch {
    return "";
  }
};

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key Missing");
        
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Generate a clinical report for ${profile.name}. Weight: ${profile.weight}kg. Recent: ${JSON.stringify(logs.slice(0, 20))}.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Generate a professional medical visit summary in English." 
          }
        });
        return response.text || "Report unavailable.";
      } catch {
        return "Error generating clinical report.";
      }
};
