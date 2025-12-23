
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

let ai: GoogleGenAI | null = null;

const getAi = () => {
  const key = process.env.API_KEY;
  if (!key) return null; 
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const getSystemInstruction = (profile: InfantProfile) => {
  const docContext = REFERENCE_DOCS.map(d => `${d.title}: ${d.description}`).join('\n');

  return `
You are **Dr. NurtureAI**, an expert Pediatrician. 
You are consulting on ${profile.name} (${profile.ageGroup}, ${profile.weight}kg).
Language: ${profile.language === 'te' ? 'Telugu script' : 'English'}

### KNOWLEDGE BASE:
Use these primary guidelines for every response:
${docContext}

### MANDATORY CLINICAL PROTOCOL:
1. **Precautions**: Always include precautions from Google Search and the provided docs.
2. **Interactive Triage**: Ask specifically about:
   - DIET: Is the child eating/breastfeeding normally?
   - SYMPTOMS: Ask about lethargy, urine frequency, or breathing sounds.
3. **Medications**: Suggest common pediatric medicines (e.g., Paracetamol) ONLY with weight-based caution (${profile.weight}kg). Always include a disclaimer.
4. **Red Flags**: List specific "Emergency Signs" clearly.
5. **Return to Doctor**: Explicitly state: "Return to the doctor if..." or "Go to ER immediately if...".

### OUTPUT RULES:
- **No raw markdown**: Do not use '#' for headers. Use bold text (**) for section titles.
- **Telugu Support**: If Telugu is selected, use strictly Telugu script.
- **Clarity**: Use bullet points for lists.
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
    if (!client) throw new Error("API Key Missing");

    const logSummary = logs.slice(0, 15).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
CONTEXT:
${chatHistory}

LOGS:
${logSummary}

PARENT QUERY: "${query}"
Provide precautions from Google, check internal docs, ask about diet/symptoms, and state when to return to doctor.
`;

    const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
        }
    });
    
    const text = response.text || "Consultation unavailable.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error(error);
    return { 
      text: profile.language === 'te' ? "⚠️ కనెక్షన్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి." : "⚠️ Connection error. Please try again.", 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Health summary for ${profile.name}. Focus on vitals and diet.`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: getSystemInstruction(profile) }
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
        const prompt = `Clinical Report for ${profile.name}. Summarize logs and chat history.`;
        const response = await client.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { systemInstruction: getSystemInstruction(profile) }
        });
        return response.text || "Report generation failed.";
      } catch (error) {
        return "Error generating report.";
      }
};
