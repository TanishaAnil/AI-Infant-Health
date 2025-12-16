import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

// Initialize the client lazily
let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!ai) {
    const key = process.env.API_KEY || "";
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const getSystemInstruction = (profile: InfantProfile) => {
  const docList = REFERENCE_DOCS.map(d => `- ${d.title}: ${d.description}`).join('\n');

  return `
You are NurtureAI, a warm, caring, and highly specialized pediatric health assistant.
You are talking to ${profile.parentName}, the parent of ${profile.name} (${profile.ageGroup}).

CORE PERSONA:
1. **Friendly & Reassuring**: Always start with a warm tone. Parenting is hard; be supportive. (e.g., "That's a great question, ${profile.parentName}...", "It is completely normal to worry about...")
2. **Evidence-Based**: You do not guess. You base your answers STRICTLY on general pediatric knowledge and the following specific documents:
${docList}
3. **Citation**: When you give advice, explicitly mention the source document in a friendly way. (e.g., "The AAP Safe Sleep guidelines suggest...", "According to IMNCI protocols...").

USER PROFILE:
- Baby Name: ${profile.name}
- Age: ${profile.ageGroup}
- Language: ${profile.language === 'te' ? 'Telugu (తెలుగు)' : 'English'}

INSTRUCTIONS:
- If the user asks about fever or symptoms, check the provided Logs carefully.
- If the temperature is above 38°C, prioritize medical attention in your response.
- If the language is Telugu, write in Telugu script but keep medical terms (like 'Paracetamol', 'Fahrenheit') in English/Latin script for clarity if needed.
- Keep responses concise (under 150 words) unless a detailed report is requested.
- Use bold text (**text**) for key points to make it readable.
`;
};

export const generateHealthInsight = async (logs: LogEntry[], query: string, profile: InfantProfile, chatHistory: string): Promise<string> => {
  try {
    const logSummary = logs.slice(0, 20).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
    CURRENT STATUS:
    Baby: ${profile.name} (${profile.ageGroup})
    Recent Logs: ${logSummary}
    
    CONVERSATION HISTORY:
    ${chatHistory}
    
    PARENT QUERY: "${query}"
    
    Please provide a helpful, reassuring, and evidence-based response.
    `;

    // Ensure AI is initialized
    const client = getAi();
    if (!client) throw new Error("AI Client failed to initialize");

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(profile),
        temperature: 0.7, // Slightly higher for warmth/creativity in phrasing
      }
    });

    return response.text || "I apologize, I'm having trouble thinking of a response right now.";
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    if (error.message?.includes('API key')) {
        return "It looks like my connection key is missing. Please check your settings.";
    }
    return "I'm having a little trouble connecting to the medical database. Please try asking again in a moment.";
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const logSummary = logs.map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
    const prompt = `Generate a very short, encouraging 2-sentence summary of these logs for ${profile.parentName}. Mention one positive thing. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

    const client = getAi();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: getSystemInstruction(profile) }
    });

    return response.text || "";
  } catch (error) {
    console.error("Summary Error:", error);
    return "";
  }
}

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const logSummary = logs.map(log => `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
        
        const prompt = `
        Generate a comprehensive "Infant Health Report" for downloading.
        Patient: ${profile.name}
        Data: ${logSummary}
        Concerns: ${chatHistory}
        
        Output Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.
        Format: Markdown.
        `;
    
        const client = getAi();
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { systemInstruction: getSystemInstruction(profile) }
        });
    
        return response.text || "Report generation failed.";
      } catch (error) {
        console.error("Report Error:", error);
        return "Could not generate report due to an error.";
      }
}