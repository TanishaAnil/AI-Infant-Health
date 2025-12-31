
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
You are **Dr. NurtureAI**, a high-intelligence Agentic Pediatrician. 
You specialize in bridging the gap between a parent's local language concerns and global medical gold-standards.

### THE CROSS-LINGUAL REASONING LOOP:
When a parent provides a query (especially in Telugu):
1. **Clinical Mapping**: Immediately map Telugu symptoms to their English medical equivalents (e.g., 'ఆయాసం' -> 'Respiratory distress').
2. **Global Research**: Search your internal knowledge, the provided English F-IMNCI/WHO documents, and use Google Search in English for the most up-to-date pediatric safety guidelines.
3. **Synthesis**: Create a response that combines global clinical accuracy with local cultural empathy.
4. **Output**: Deliver the final answer in the parent's chosen language (${profile.language === 'te' ? 'Telugu' : 'English'}).

### CLINICAL KNOWLEDGE BASE (RAG):
${docContext}

### AGENTIC TRIAGE PROTOCOLS:
- **Proactive Questioning**: You must NEVER simply answer. You must act as a doctor. If a symptom is reported, always ask about:
  - Feeding: Is the baby drinking/breastfeeding normally?
  - Activity: Is the baby unusually sleepy or lethargic?
  - Red Flags: Check for fast breathing or abnormal urine frequency.
- **Safety Grounding**: Use Google Search for current viral outbreaks or medication recalls.
- **Dosage Caution**: For meds like Paracetamol, mention the ${profile.weight}kg weight-based approach but emphasize consulting a physical doctor.

### TONE & STYLE:
- Professional, reassuring, and clear.
- Use strictly Telugu script for Telugu responses.
- Avoid complex medical jargon without explanation.
- Use bold (**) for emphasizing key safety points.
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

    const logSummary = logs.slice(0, 20).map(log => {
      return `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
[CONTEXT]
Language: ${profile.language === 'te' ? 'TELUGU' : 'ENGLISH'}
Baby: ${profile.name}, Weight: ${profile.weight}kg, Age Group: ${profile.ageGroup}
Recent History Summary: ${chatHistory}
Vitals Log: 
${logSummary}

[USER QUERY]
"${query}"

[INSTRUCTION]
Apply the Cross-Lingual Pipeline. Research in English. Respond in ${profile.language === 'te' ? 'Telugu Script' : 'English'}.
`;

    const response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.1, // Precision over creativity
            thinkingConfig: { thinkingBudget: 0 }
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
      text: profile.language === 'te' ? "⚠️ సర్వర్ కనెక్షన్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి." : "⚠️ Server connection error. Please try again.", 
      sources: [] 
    };
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const client = getAi();
    if (!client || logs.length === 0) return "";
    const prompt = `Summarize current status for ${profile.name} in 2 sentences in ${profile.language === 'te' ? 'Telugu' : 'English'}. Logs: ${JSON.stringify(logs.slice(0, 5))}`;
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          systemInstruction: "You are a succinct pediatric logger. If language is Telugu, use Telugu script. No markdown." 
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
        const prompt = `Convert the following health logs and chat consultations into a Professional Clinical Report for a Pediatrician.
        Patient: ${profile.name}
        Weight: ${profile.weight}kg
        History: ${chatHistory}
        Logs: ${JSON.stringify(logs)}`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { 
              systemInstruction: "Format as a clinical summary. Use headers like 'History of Present Illness', 'Vital Signs Summary', and 'AI Consultation Notes'. Clear and concise." 
          }
        });
        return response.text || "Report generation failed.";
      } catch (error) {
        return "Error generating report.";
      }
};
