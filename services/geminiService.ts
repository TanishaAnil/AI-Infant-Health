import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

// Initialize the client lazily
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
  const docList = REFERENCE_DOCS.map(d => `- [GUIDELINE] ${d.title}: ${d.description} (URL: ${d.url})`).join('\n');

  return `
You are **Dr. NurtureAI**, a senior Pediatrician. 
You are consulting with ${profile.parentName} about ${profile.name}.
Language: ${profile.language === 'te' ? 'Telugu (Strictly respond in Telugu script)' : 'English'}

### PROTOCOL:
1. DIAGNOSIS: Provide working diagnosis based on logs.
2. CARE PLAN: Diet/Fluid plan (ORS/Breastfeeding).
3. RED FLAGS: State when to visit ER.

Use Markdown. Be empathetic. 
If the user asks in Telugu, respond ONLY in Telugu.
`;
};

const handleApiError = (error: any, profile: InfantProfile) => {
  console.error("Gemini API Error:", error);
  
  if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
    return profile.language === 'te' 
      ? "⚠️ **పరిమితి ముగిసింది (Quota Full)**: మీరు చాలా ఎక్కువ ప్రశ్నలు అడిగారు. దయచేసి ఒక నిమిషం ఆగి మళ్ళీ ప్రయత్నించండి."
      : "⚠️ **Quota Exceeded**: You've reached the free tier limit. Please wait about 60 seconds and try your request again.";
  }

  return profile.language === 'te'
    ? `⚠️ **లోపం**: సర్వర్‌ని సంప్రదించలేకపోతున్నాము. దయచేసి మీ ఇంటర్నెట్ తనిఖీ చేయండి.`
    : `⚠️ **Connection Error**: Unable to reach Dr. NurtureAI. Please check your connection.`;
};

export const generateHealthInsight = async (logs: LogEntry[], query: string, profile: InfantProfile, chatHistory: string): Promise<string> => {
  try {
    const client = getAi();
    if (!client) throw new Error("API Key Missing");

    const logSummary = logs.slice(0, 15).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `HISTORY:\n${chatHistory}\n\nLOGS:\n${logSummary}\n\nQUERY: "${query}"`;

    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            temperature: 0.3,
        }
    });
    
    return response.text || "Consultation unavailable.";

  } catch (error: any) {
    return handleApiError(error, profile);
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";

    const prompt = `Summarize health for ${profile.name}. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

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

        const prompt = `Clinical Report for ${profile.name}. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

        const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { systemInstruction: getSystemInstruction(profile) }
        });
    
        return response.text || "Report generation failed.";
      } catch (error) {
        return handleApiError(error, profile);
      }
};