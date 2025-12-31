
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
You are **Dr. NurtureAI**, a world-class Agentic Pediatrician. 
Your core capability is the **Cross-Lingual Clinical Bridge**.

### YOUR WORKFLOW:
If the user speaks/types in Telugu:
1. **Semantic Translation**: Map the Telugu concern to English medical terminology.
2. **Clinical Research (English)**: Consult the F-IMNCI and WHO documents provided below.
3. **Google Search (English)**: Use the Google Search tool in English to find the latest pediatric safety warnings, local viral trends, or medication recalls.
4. **Synthesis & Localization**: Formulate a response that follows medical protocol and translate it back into warm, conversational, and natural Telugu script.

### MEDICAL KNOWLEDGE BASE (English Source):
${docContext}

### MANDATORY CLINICAL TRIAGE:
- **Red Flag Check**: If ANY symptom is reported, you MUST ask:
  - "పాప/బాబు పాలు సరిగ్గా తాగుతున్నారా?" (Feeding status)
  - "శరీరం వేడిగా ఉందా లేదా గాలి పీల్చడంలో ఇబ్బంది పడుతున్నారా?" (Temp/Breathing)
  - "చురుకుగా ఉన్నారా లేదా ఎప్పుడూ నిద్రపోతున్నారా?" (Activity/Lethargy)
- **Dosage Safety**: For a ${profile.weight}kg infant, never give specific dosages; instead, mention the weight-based approach of standard pediatrics and insist on a physical checkup.
- **Grounding**: Always cite your sources via the Google Search grounding chunks.

### OUTPUT FORMAT:
- Use strictly Telugu script for Telugu responses.
- Keep sentences short and voice-friendly.
- Use bold (**) for critical warnings.
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

    const recentLogs = logs.slice(0, 10).map(log => {
      return `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[PATIENT PROFILE]
Language: ${profile.language === 'te' ? 'TELUGU' : 'ENGLISH'}
Name: ${profile.name}, Weight: ${profile.weight}kg
History: ${chatHistory}
Vitals: ${recentLogs}

[PARENT CONCERN]
"${query}"

[INSTRUCTIONS]
1. Translate context to English. 
2. Research via English F-IMNCI docs and Google Search. 
3. Respond in ${profile.language === 'te' ? 'Telugu Script' : 'English'}.
4. Perform mandatory triage questions.
`;

    const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.15,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const text = response.text || "Consultation error.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isKeyError = error.message?.includes("API Key");
    return { 
      text: profile.language === 'te' 
        ? (isKeyError ? "⚠️ API కీ కనుగొనబడలేదు. దయచేసి వాతావరణ వేరియబుల్స్ తనిఖీ చేయండి." : "⚠️ సర్వర్ కనెక్షన్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి.")
        : (isKeyError ? "⚠️ API Key not found. Please check your environment variables." : "⚠️ Server connection error. Please try again."), 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Summarize current status for ${profile.name} in 2 sentences in ${profile.language === 'te' ? 'Telugu' : 'English'}. Logs: ${JSON.stringify(logs.slice(0, 3))}`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "You are a succinct pediatric health logger. Use plain text." 
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
        const prompt = `Generate a Formal Pediatric Report. 
        Patient: ${profile.name}, ${profile.weight}kg. 
        Recent Logs: ${JSON.stringify(logs.slice(0, 20))}
        Consulations: ${chatHistory}`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Format as a professional medical report for a hospital visit." 
          }
        });
        return response.text || "Report generation failed.";
      } catch (error) {
        return "Error generating report.";
      }
};
