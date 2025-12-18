
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile, AgeGroup } from "../types";
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
  return `
You are **Dr. NurtureAI**, a senior Pediatrician.
Language: ${profile.language === 'te' ? 'Telugu (Respond ONLY in Telugu script)' : 'English'}

### PEDIATRIC REFERENCE RANGES:
- **SpO2**: Normal 95-100%. Emergency if <92%.
- **Heart Rate**: Newborn (100-160), 1yr (80-130).
- **Diabetes Screening**: Look for the "3 Ps" in children: Polyuria (too much urine), Polydipsia (too much thirst), Polyphagia (extreme hunger), and sudden weight loss. If glucose >180 mg/dL or ketotic breath is mentioned, triage immediately.

### PROTOCOL:
1. TRIAGE: Check for Respiratory Distress, Cyanosis (blue lips), or Lethargy.
2. VITALS ANALYSIS: Comment on Heart Rate, SpO2, and Temperature logs provided.
3. DIABETES CARE: If blood sugar is logged, provide pediatric context.
4. RED FLAGS: Clearly state when to visit ER.

Strictly respond in the user's selected language (${profile.language}).
`;
};

const handleApiError = (error: any, profile: InfantProfile) => {
  if (error?.message?.includes('429')) {
    return profile.language === 'te' 
      ? "⚠️ **పరిమితి ముగిసింది**: దయచేసి ఒక నిమిషం ఆగి మళ్ళీ ప్రయత్నించండి."
      : "⚠️ **Quota Exceeded**: Please wait 60 seconds and try again.";
  }
  return profile.language === 'te' ? "⚠️ కనెక్షన్ లోపం." : "⚠️ Connection Error.";
};

export const generateHealthInsight = async (logs: LogEntry[], query: string, profile: InfantProfile, chatHistory: string): Promise<string> => {
  try {
    const client = getAi();
    if (!client) throw new Error("API Key Missing");

    const logSummary = logs.slice(0, 20).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `PATIENT PROFILE: ${profile.name}, ${profile.ageGroup}.
    
    HISTORY:
    ${chatHistory}
    
    LOGS:
    ${logSummary}
    
    QUERY: "${query}"`;

    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            temperature: 0.2,
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
    const prompt = `Provide a health summary for ${profile.name} based on vitals. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;
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
        const prompt = `Clinical Progress Report for ${profile.name}. Include vitals analysis. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;
        const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { systemInstruction: getSystemInstruction(profile) }
        });
        return response.text || "Report failed.";
      } catch (error) {
        return handleApiError(error, profile);
      }
};
