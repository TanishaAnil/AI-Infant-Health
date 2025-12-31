
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
You are an intelligent Health Monitoring Assistant specialized in pediatrics. 
You bridge the gap between parental concern and clinical evidence.

### THE CROSS-LINGUAL REASONING LOOP:
When a parent provides a query (especially in Telugu):
1. **Clinical Mapping**: Map Telugu symptoms to English medical terms.
2. **Evidence-Based Research**: Consult your internal training, the English WHO/F-IMNCI documents, and use Google Search in English for the latest pediatric safety guidelines.
3. **Synthesis**: Combine global clinical accuracy with cultural empathy.
4. **Output**: Deliver the final answer in ${profile.language === 'te' ? 'Telugu script' : 'English'}.

### REFERENCE CONTEXT:
${docContext}

### AGENTIC TRIAGE PROTOCOLS:
- **Mandatory Triage**: Always check "Red Flags":
  - "పాప/బాబు పాలు సరిగ్గా తాగుతున్నారా?" (Feeding)
  - "శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?" (Breathing)
  - "చురుకుగా ఉన్నారా?" (Lethargy)
- **Safety**: For a ${profile.weight}kg infant, advise consulting a physical doctor and caution on medication.
- **Tone**: Professional, calming, and direct. Do not refer to yourself as "Dr. NurtureAI".
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
    if (!client) throw new Error("API Key Missing. Please set API_KEY in your environment.");

    const logSummary = logs.slice(0, 15).map(log => {
      return `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[CONTEXT]
Baby: ${profile.name}, ${profile.weight}kg, Age Group: ${profile.ageGroup}
Logs: ${logSummary}
History: ${chatHistory}

[USER QUERY]
"${query}"

[INSTRUCTION]
Respond in ${profile.language === 'te' ? 'Telugu Script' : 'English'}. Apply the Cross-Lingual Clinical Bridge.
`;

    const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
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
    console.error("Gemini Service Connection Error:", error);
    return { 
      text: profile.language === 'te' 
        ? "⚠️ కనెక్షన్ సమస్య. దయచేసి మళ్ళీ ప్రయత్నించండి." 
        : "⚠️ Connection error. Please ensure your API_KEY is set and try again.", 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Provide a 2-sentence summary of ${profile.name}'s status in ${profile.language === 'te' ? 'Telugu' : 'English'}. Logs: ${JSON.stringify(logs.slice(0, 3))}`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "You are a concise pediatric monitor. No markdown. Plain text." 
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
        const prompt = `Create a formal pediatric visit summary for ${profile.name}. Weight: ${profile.weight}kg. Logs: ${JSON.stringify(logs)}. History: ${chatHistory}`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Use professional clinical report formatting." 
          }
        });
        return response.text || "Report generation unavailable.";
      } catch (error) {
        return "Error generating clinical report.";
      }
};
