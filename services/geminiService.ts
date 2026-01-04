
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

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

export const generateHealthInsight = async (
  logs: LogEntry[], 
  query: string, 
  profile: InfantProfile, 
  chatHistory: string
): Promise<AIResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
        // Using 'gemini-flash-lite-latest' for maximum free tier stability
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const text = response.text || "I'm having trouble analyzing the data right now.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Health Insight Error:", error);
    const errorMessage = error?.message || "Unknown connection error";
    const isTe = profile.language === 'te';
    
    if (errorMessage.includes("Quota exceeded") || errorMessage.includes("429")) {
      return {
        text: isTe 
          ? "⚠️ ఉచిత పరిమితి (Free Limit) ముగిసింది. దయచేసి కొన్ని సెకన్లు ఆగి మళ్ళీ ప్రయత్నించండి." 
          : "⚠️ Free Tier Limit Reached. Please wait a few seconds and try your request again.",
        sources: []
      };
    }

    return { 
      text: isTe 
        ? `⚠️ కనెక్షన్ ఇబ్బంది: ${errorMessage}.` 
        : `⚠️ Connection error: ${errorMessage}. Please try again.`, 
      sources: [] 
    };
  }
};

export const generateDynamicSuggestions = async (history: string, logs: LogEntry[], language: 'en' | 'te'): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const latestLogs = logs.slice(0, 2).map(l => l.type).join(', ');
    
    const prompt = `Suggest 4 short follow-up questions for a parent based on:
    History: ${history.slice(-500)}
    Recent activity: ${latestLogs}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          systemInstruction: `Suggest brief pediatric follow-up questions in ${language === 'te' ? 'Telugu' : 'English'}.`,
          thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  } catch (error) {
    return [];
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Summarize ${profile.name}'s status briefly in ${profile.language === 'te' ? 'Telugu' : 'English'}. Logs: ${JSON.stringify(logs.slice(0, 2))}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: { 
        systemInstruction: "Pediatric summary agent.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "";
  } catch {
    return "";
  }
};

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Clinical report for ${profile.name}. Logs: ${JSON.stringify(logs.slice(0, 20))}.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: prompt,
          config: { 
            systemInstruction: "Professional medical summary.",
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        return response.text || "Report unavailable.";
      } catch {
        return "Error generating clinical report.";
      }
};
