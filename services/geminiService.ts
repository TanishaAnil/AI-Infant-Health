import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

// Initialize the client lazily
let ai: GoogleGenAI | null = null;

const getAi = () => {
  // Access the key which is polyfilled by vite.config.ts from .env or system env
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
You are **Dr. NurtureAI**, a senior Pediatrician and Child Health Specialist adhering to WHO F-IMNCI (Facility Based Integrated Management of Neonatal and Childhood Illness) and AAP guidelines.
You are consulting with ${profile.parentName}, the parent of ${profile.name}.
Patient Details:
- Age Group: ${profile.ageGroup}
- Weight: ${profile.weight}kg
- Language Preference: ${profile.language === 'te' ? 'Telugu (use English for medical terms)' : 'English'}

### CONSULTATION PROTOCOL (STRICT ORDER):

1.  **STEP 1: TRIAGE & DIFFERENTIAL VERIFICATION:**
    *   **Do NOT prescribe immediately** if the symptom is new or vague.
    *   **Verify Related Diseases:** If user says "Fever", you MUST ask about related severe symptoms (Rash, Neck Stiffness, Fast Breathing).
    *   *If user says "Cough/Cold":* Ask about "Chest indrawing" or "Fast breathing".
    *   *If user says "Diarrhea":* Ask about "Blood in stool", "Thirst".

2.  **STEP 2: DIAGNOSIS & EXPLANATION:**
    *   State the **Working Diagnosis**.
    *   Reference the **Internal Documents** where applicable.

3.  **STEP 3: COMPREHENSIVE CARE PLAN:**
    *   **A. DIET & FLUID PLAN (Mandatory):**
        *   *0-6 Months:* Exclusive Breastfeeding. Feed frequently.
        *   *6+ Months:* Soft foods + Breastfeeding.
        *   *Fluids:* ORS volume if dehydration is suspected.
    *   **B. MEDICINES:**
        *   Suggest OTC meds (Paracetamol, Zinc) ONLY if relevant.
        *   **Calculated Dosage:** Estimate dosage based on **${profile.weight}kg**.
        *   *WARNING:* "Always verify exact dose with the pharmacist."

4.  **STEP 4: FOLLOW-UP & RED FLAGS:**
    *   **When to Return:** "Bring the child back immediately if: [Danger Signs]."

5.  **INTERNAL REFERENCE DOCS:**
    ${docList}

### RESPONSE FORMAT:
*   Use Markdown with clear **Headings**.
*   Be empathetic but authoritative.
`;
};

export const generateHealthInsight = async (logs: LogEntry[], query: string, profile: InfantProfile, chatHistory: string): Promise<string> => {
  try {
    const key = process.env.API_KEY;
    if (!key) {
        return "⚠️ **Configuration Error: API Key Missing**\n\nTo use the AI Doctor features, you must configure your API Key.\n\n1. Create a file named `.env` in the root folder.\n2. Add `API_KEY=your_key_here`\n3. Restart the terminal.";
    }

    const logSummary = logs.slice(0, 20).map(log => {
      return `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`;
    }).join('\n');

    const prompt = `
    CURRENT VITALS & LOGS:
    ${logSummary}
    
    CONSULTATION HISTORY:
    ${chatHistory}
    
    PARENT QUERY: "${query}"
    
    INSTRUCTIONS:
    1. If this is a new symptom, ask Rule-Out questions.
    2. Give a Diet Plan suitable for ${profile.weight}kg.
    3. Tell them exactly when to visit the doctor.
    `;

    const client = getAi();
    if (!client) throw new Error("AI Client failed to initialize");

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(profile),
        temperature: 0.3,
        tools: [{ googleSearch: {} }],
      }
    });

    let finalText = response.text || "I apologize, I cannot provide a consultation right now.";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web?.title ? `- [${chunk.web.title}](${chunk.web.uri})` : null)
        .filter(Boolean)
        .join('\n');
      
      if (sources) {
        finalText += `\n\n**External Web References:**\n${sources}`;
      }
    }

    return finalText;

  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    if (error.message?.includes('API key')) {
        return "System Alert: Medical Database Connection Failed (API Key missing or invalid). Please check your .env file.";
    }
    return "I am having trouble accessing the medical protocols. Please consult a physical doctor immediately if the situation is urgent.";
  }
};

export const generateDailySummary = async (logs: LogEntry[], profile: InfantProfile): Promise<string> => {
  try {
    const key = process.env.API_KEY;
    if (!key) return "";

    const logSummary = logs.map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
    const prompt = `Generate a 2-sentence 'Morning Rounds' summary for ${profile.parentName} about ${profile.name}. Mention trends. Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.`;

    const client = getAi();
    if (!client) return "";

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
        const key = process.env.API_KEY;
        if (!key) return "Error: API Key missing. Please configure .env file.";

        const logSummary = logs.map(log => `[${log.timestamp.toLocaleString()}] ${log.type}: ${JSON.stringify(log.details)}`).join('\n');
        
        const prompt = `
        Generate a "Clinical Discharge / Progress Report" for a Pediatrician.
        Patient: ${profile.name}
        Vitals/Logs: ${logSummary}
        Consultation Notes: ${chatHistory}
        
        Output Language: ${profile.language === 'te' ? 'Telugu' : 'English'}.
        Format: Markdown. Include sections: Chief Complaint, Vitals Review, Impression (Diagnosis), Clinical Plan (Diet, Meds, Follow-up).
        `;
    
        const client = getAi();
        if (!client) return "AI Client Initialization Failed.";

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
