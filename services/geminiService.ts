import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { 
  DOC_1_TITLE, DOC_1_CONTENT,
  DOC_2_TITLE, DOC_2_CONTENT,
  DOC_3_TITLE, DOC_3_CONTENT 
} from "./documents";

// Initialize the client
// Using gemini-2.5-flash for speed and efficiency as requested.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (profile: InfantProfile) => `
You are NurtureAI, a specialized pediatric health assistant.
User Profile:
- Baby: ${profile.name}
- Age Stage: ${profile.ageGroup}
- Parent: ${profile.parentName}
- Language Preference: ${profile.language === 'te' ? 'Telugu (తెలుగు)' : 'English'}

CORE DIRECTIVES:
1. **Language**: If the preference is Telugu, YOU MUST REPLY IN TELUGU (using Telugu script). Provide English medical terms in parentheses if complex.
2. **Knowledge Base**: You have access to 3 reference documents below. **You must prioritize advice from these documents.**
3. **Citations**: When you use information from the documents, explicitly mention it (e.g., "According to the ${DOC_1_TITLE}..." or "డాక్యుమెంట్ ప్రకారం...").
4. **Safety**: If high fever or dangerous symptoms are detected, warn the user immediately.

KNOWLEDGE BASE:
--- DOCUMENT 1: ${DOC_1_TITLE} ---
${DOC_1_CONTENT}

--- DOCUMENT 2: ${DOC_2_TITLE} ---
${DOC_2_CONTENT}

--- DOCUMENT 3: ${DOC_3_TITLE} ---
${DOC_3_CONTENT}
`;

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
    Refer to the provided documents for your answer.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(profile),
        temperature: 0.5, // Lower temperature for more faithful adherence to documents
      }
    });

    return response.text || "I apologize, I could not generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const logSummary = logs.map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
    const prompt = `Generate a 2-sentence summary of these logs for ${profile.name}. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: getSystemInstruction(profile) }
    });

    return response.text || "";
  } catch (error) {
    return "";
  }
}

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const logSummary = logs.map(log => `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
        
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
        4. AI Recommendations (Strictly based on ${DOC_1_TITLE}, ${DOC_2_TITLE}, and ${DOC_3_TITLE})
        
        Output Language: ${profile.language === 'te' ? 'Telugu (with English headers)' : 'English'}.
        Format: Markdown.
        `;
    
        const response = await ai.models.generateContent({
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
