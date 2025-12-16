import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

// Initialize the client lazily
let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!ai) {
    // Accessing process.env.API_KEY here is safe because Vite replaces it at build time.
    // We use a fallback empty string to prevent the constructor from throwing immediately if the key is missing,
    // allowing the UI to load. The SDK will throw a specific error when a request is actually made.
    const key = process.env.API_KEY || "";
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const getSystemInstruction = (profile: InfantProfile) => {
  const docList = REFERENCE_DOCS.map(d => `- ${d.title} (${d.url}): ${d.description}`).join('\n');

  return `
You are NurtureAI, a specialized pediatric health assistant.
User Profile:
- Baby: ${profile.name}
- Age Stage: ${profile.ageGroup}
- Parent: ${profile.parentName}
- Language Preference: ${profile.language === 'te' ? 'Telugu (తెలుగు)' : 'English'}

CORE DIRECTIVES:
1. **Language**: If the preference is Telugu, YOU MUST REPLY IN TELUGU (using Telugu script). Provide English medical terms in parentheses if complex.
2. **Knowledge Base**: You are an expert on the following documents. Use your internal knowledge of these specific texts to guide your advice:
${docList}
3. **Citations**: When providing advice, mention which guideline you are referencing (e.g., "According to WHO guidelines..." or "AAP నిద్ర నియమాల ప్రకారం...").
4. **Safety**: If high fever or dangerous symptoms are detected, warn the user immediately.
`;
};

export const generateHealthInsight = async (logs: LogEntry[], query: string, profile: InfantProfile, chatHistory: string): Promise<string> => {
  try {
    const logSummary = logs.slice(0, 20).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
    CONTEXT:
    Baby: ${profile.name} (${profile.ageGroup})
    Logs: ${logSummary}
    Chat History: ${chatHistory}
    
    USER QUERY: "${query}"
    
    Respond in ${profile.language === 'te' ? 'Telugu' : 'English'}.
    `;

    // Ensure AI is initialized
    const client = getAi();
    if (!client) throw new Error("AI Client failed to initialize");

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(profile),
        temperature: 0.5, 
      }
    });

    return response.text || "I apologize, I could not generate a response. Please try again.";
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Provide a user-friendly error message that might help debug
    if (error.message?.includes('API key')) {
        return "Error: Invalid or missing API Key. Please check your .env file.";
    }
    return "I am having trouble connecting to the knowledge base right now. Please try again in a moment.";
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const logSummary = logs.map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
    const prompt = `Generate a 2-sentence summary of these logs for ${profile.name}. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

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
        const docNames = REFERENCE_DOCS.map(d => d.title).join(', ');

        const prompt = `
        Generate a comprehensive "Infant Health Report" for downloading.
        
        Patient: ${profile.name}
        Age: ${profile.ageGroup}
        Weight: ${profile.weight}kg
        
        Data:
        ${logSummary}
        
        Recent Concerns (from chat):
        ${chatHistory}
        
        Structure the report as follows:
        1. Patient Vitals Summary
        2. Feeding & Sleep Analysis
        3. Recent Symptoms & Observations
        4. AI Recommendations (Strictly aligned with ${docNames})
        
        Output Language: ${profile.language === 'te' ? 'Telugu (with English headers)' : 'English'}.
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