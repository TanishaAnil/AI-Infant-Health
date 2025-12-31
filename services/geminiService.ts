
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

let ai: GoogleGenAI | null = null;

const getAi = () => {
  const key = process.env.API_KEY;
  if (!key || key === "") return null; 
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const getSystemInstruction = (profile: InfantProfile) => {
  const docContext = REFERENCE_DOCS.map(d => `${d.title}: ${d.description}`).join('\n');

  return `
You are an intelligent Health Monitoring Assistant. 
You act as a **Cross-Lingual Clinical Bridge**. 

### CORE CAPABILITY:
- **Input Processing**: You accept input in Telugu or English. If in Telugu, you internally map it to clinical English terms to perform high-accuracy reasoning.
- **RAG Reasoning**: You consult the provided pediatric documents and use Google Search in English to find the most up-to-date medical evidence.
- **Output Generation**: You translate complex clinical findings back into natural, empathetic ${profile.language === 'te' ? 'Telugu script' : 'English'}.

### REFERENCE CONTEXT:
${docContext}

### TRIAGE PROTOCOLS (Mandatory):
- Always check "Red Flags" (Breathing, Feeding, Lethargy) if a symptom is mentioned.
- For a ${profile.weight}kg infant, prioritize safety and professional consultation.
- Tone: Calm, professional, and evidence-based.
- **DO NOT** refer to yourself as "Dr. NurtureAI". You are a Health Monitoring Assistant.
`;
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
    const client = getAi();
    if (!client) throw new Error("API Key Missing.");

    const logSummary = logs.slice(0, 10).map(log => {
      return `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[VITALS LOGS]
${logSummary}

[CHAT HISTORY]
${chatHistory}

[USER QUERY]
"${query}"

[TASK]
1. If input is Telugu, translate clinical intent to English.
2. Search and Reason in English for best pediatric evidence.
3. Respond in ${profile.language === 'te' ? 'Telugu Script' : 'English'}.
`;

    const response = await client.models.generateContent({
        // Gemini 3 Flash is the best 'small/smooth/fast' model for this real-time pipeline
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const text = response.text || "I am currently unable to process health data.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return { 
      text: profile.language === 'te' 
        ? "⚠️ క్షమించండి, కనెక్షన్ సమస్య ఏర్పడింది." 
        : "⚠️ Sorry, there was a connection issue.", 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Summary for ${profile.name} status in 2 short sentences (${profile.language === 'te' ? 'Telugu' : 'English'}): ${JSON.stringify(logs.slice(0, 3))}`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "Concise pediatric monitor. No markdown. Use Telugu if requested." 
      }
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const client = getAi();
        if (!client) throw new Error("API Key Missing");
        const prompt = `Clinical visit summary for ${profile.name}. Weight: ${profile.weight}kg. Logs: ${JSON.stringify(logs)}. History: ${chatHistory}`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Professional medical documentation style." 
          }
        });
        return response.text || "Report generation unavailable.";
      } catch (error) {
        return "Error generating clinical report.";
      }
};
