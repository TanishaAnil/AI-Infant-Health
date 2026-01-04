
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

const getSystemInstruction = (profile: InfantProfile) => {
  const docContext = REFERENCE_DOCS.map(d => `${d.title}: ${d.description}`).join('\n');

  return `You are "NurtureAI Physician Assistant," a clinical agentic AI. 

INTERNAL REASONING LOOP:
1. INPUT: Detect language (${profile.language === 'te' ? 'Telugu' : 'English'}).
2. TRANSLATION: If Telugu, translate the intent to professional medical English.
3. RAG SEARCH: Query the provided documents and Google Search (using English) for pediatric standards (AAP, WHO, NHM India).
4. SYNTHESIS: Combine recent logs with clinical findings.
5. PROACTIVE INQUIRY: Identify what's missing (e.g., if fever is mentioned but no hydration status is known, ASK).
6. OUTPUT: Generate a structured response in ${profile.language === 'te' ? 'Telugu' : 'English'}.

REQUIRED OUTPUT STRUCTURE (DO NOT USE # OR * SYMBOLS):
- [SUMMARY]: Clear explanation of what is happening.
- [DIET & HYDRATION]: Specific feeding advice based on age.
- [SYMPTOM CHECKLIST]: Proactively ask 2-3 targeted questions about related issues (e.g., urine count, activity level).
- [MEDICINES & SAFETY]: State clearly that only a physical doctor can prescribe. Provide home care safety tips (e.g., paracetamol safety).
- [RED FLAGS]: List critical signs for immediate ER visit.
- [DOCTOR CONSULTATION]: Explicit criteria for when to book a non-emergency appointment.

STRICT RULES:
- REMOVE all markdown markers like asterisks (*), hashes (#), or underscores (_). Use CAPITALIZED HEADERS for sections.
- Never give specific dosages without a "Consult your doctor" disclaimer.
- Be empathetic but clinical.`;
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
    
    const logSummary = logs.slice(0, 10).map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `[${time}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
INFANT DATA:
Name: ${profile.name}
Weight: ${profile.weight}kg
Age Group: ${profile.ageGroup}
Recent Logs:
${logSummary}

CONVERSATION HISTORY:
${chatHistory.slice(-1500)}

PARENT MESSAGE:
"${query}"

Execute the Clinical Agentic Loop. Ensure the response is proactive, asks follow-up questions, and follows the specified structure without markdown.
`;

    const response = await ai.models.generateContent({
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
    const errorMessage = error?.message || "Connection failure";
    const isTe = profile.language === 'te';
    
    if (errorMessage.includes("Quota exceeded") || errorMessage.includes("429")) {
      return {
        text: isTe 
          ? "క్షమించాలి, సర్వర్ పరిమితి మగిసింది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి." 
          : "Free Tier Limit Reached. Please wait a moment before trying again.",
        sources: []
      };
    }

    return { 
      text: isTe 
        ? `నెట్‌వర్క్ ఇబ్బంది కలిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.` 
        : `Connection error. Please try again.`, 
      sources: [] 
    };
  }
};

export const generateDynamicSuggestions = async (history: string, logs: LogEntry[], language: 'en' | 'te'): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Suggest 3 proactive pediatric follow-up questions based on this chat: ${history.slice(-500)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          systemInstruction: `Suggest brief, proactive pediatric questions in ${language === 'te' ? 'Telugu' : 'English'}. Avoid markdown.`,
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
    const prompt = `Provide a health summary for ${profile.name} based on: ${JSON.stringify(logs.slice(0, 5))}. No markdown.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: { systemInstruction: "Brief pediatric health agent." }
    });
    return response.text || "";
  } catch {
    return "";
  }
};

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Create a formal medical report for ${profile.name} using logs: ${JSON.stringify(logs.slice(0, 20))}. Structure with headers but NO markdown symbols.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: prompt,
          config: { systemInstruction: "Professional clinical reporting agent." }
        });
        return response.text || "Report generation failed.";
      } catch {
        return "Error creating clinical report.";
      }
};
