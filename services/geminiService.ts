
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
You are **Dr. NurtureAI**, a specialized Agentic Pediatrician. 
Your core workflow is the **Cross-Lingual Clinical Reasoning Loop**.

### OPERATIONAL PIPELINE (Mandatory):
1. **Language Detection & Translation**: If the parent inputs in Telugu, immediately translate the medical intent into English clinical terms.
2. **Global Research (RAG)**: Consult the English F-IMNCI and WHO guidelines provided below to find standard protocols.
3. **Real-time Grounding**: Use the Google Search tool in English to check for current health alerts, medication recalls, or local viral outbreaks related to the symptoms.
4. **Synthesis & Synthesis**: Formulate a response that is medically sound based on your research.
5. **Localization**: Output the final response in natural, empathetic Telugu script (or English if requested).

### REFERENCE DOCUMENTS (English Context):
${docContext}

### CLINICAL PROTOCOLS:
- **Triage**: If a symptom is mentioned, always ask about "Red Flags": breathing difficulty, poor feeding, or lethargy.
- **Tone**: Professional yet reassuring.
- **Citations**: Always provide the links found via Google Search grounding.
- **Safety**: For a ${profile.weight}kg infant, advise caution with dosages and insist on physical pediatric consultation.

### FORMATTING:
- Use strictly Telugu script for Telugu output.
- Use bold (**) for emphasizing key safety points.
- No markdown headers (like #), use bold lines instead.
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
    if (!client) throw new Error("API Key Missing. Please set your API_KEY environment variable.");

    const logSummary = logs.slice(0, 15).map(log => {
      return `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[CONTEXT]
Language: ${profile.language === 'te' ? 'TELUGU' : 'ENGLISH'}
Baby Name: ${profile.name}, Weight: ${profile.weight}kg
Recent Vitals/Logs: ${logSummary}
Chat History: ${chatHistory}

[USER INPUT]
"${query}"

[TASK]
1. Map this input to English medical concepts.
2. Use Google Search and internal F-IMNCI docs to verify the best advice.
3. Provide a response in ${profile.language === 'te' ? 'Telugu script' : 'English'}.
`;

    const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.1, // High precision for medical context
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const text = response.text || "Consultation currently unavailable.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return { 
      text: profile.language === 'te' 
        ? "⚠️ కనెక్షన్ సమస్య. దయచేసి మీ API కీ మరియు ఇంటర్నెట్ సరిగ్గా ఉన్నాయో లేదో తనిఖీ చేయండి." 
        : "⚠️ Connection error. Please verify your API Key and network settings.", 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Summarize the baby's current status based on these logs in 2 brief sentences: ${JSON.stringify(logs.slice(0, 3))}. Output in ${profile.language === 'te' ? 'Telugu' : 'English'}.`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "Succinct pediatric status logger. No markdown. Use Telugu script if required." 
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
        const prompt = `Convert the following data into a clinical report for a pediatrician. 
        Baby: ${profile.name}, Weight: ${profile.weight}kg. 
        Vitals: ${JSON.stringify(logs)}
        Consultations: ${chatHistory}`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Professional medical documentation style. Use clear sections like 'Vital Signs Trend' and 'AI Recommendations'." 
          }
        });
        return response.text || "Failed to generate report.";
      } catch (error) {
        return "Error generating clinical report.";
      }
};
