import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogEntry, LogType, InfantProfile } from "../types";
import { REFERENCE_DOCS } from "./documents";

// Initialize the client lazily
let ai: GoogleGenAI | null = null;

const getAi = () => {
  const key = process.env.API_KEY;
  if (!key) return null; // Return null if no key, handled in caller
  
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

1.  **STEP 1: TRIAGE & DIFFERENTIAL VERIFICATION (The "Investigation"):**
    *   **Do NOT prescribe immediately** if the symptom is new or vague.
    *   **Verify Related Diseases:** If user says "Fever", you MUST ask about related severe symptoms to differentiate common viral fever from serious infections (Meningitis, Dengue, Pneumonia).
        *   *Ask:* "Is there any rash?", "Any neck stiffness?", "Is breathing fast?", "Any vomiting?".
    *   *If user says "Cough/Cold":* Ask about "Chest indrawing" or "Fast breathing" (Pneumonia checks).
    *   *If user says "Diarrhea":* Ask about "Blood in stool", "Thirst", "Activity level" (Dehydration checks).

2.  **STEP 2: DIAGNOSIS & EXPLANATION:**
    *   Based on provided logs/answers, state the **Working Diagnosis**.
    *   Reference the **Internal Documents** where applicable (e.g., "According to IMNCI guidelines for fever...").

3.  **STEP 3: COMPREHENSIVE CARE PLAN:**
    *   **A. DIET & FLUID PLAN (Mandatory):**
        *   Provide a specific feeding schedule suitable for **${profile.ageGroup}**.
        *   *0-6 Months:* "Exclusive Breastfeeding. Feed more frequently (every 2 hours) to prevent dehydration."
        *   *6+ Months:* Suggest specific soft foods (e.g., "Mashed dal/rice," "Stewed apple").
        *   *Fluids:* Specify ORS volume if dehydration is suspected.
    *   **B. HOME CARE:**
        *   Environmental advice (Clothing, Room temp).
        *   Hygiene advice.
    *   **C. MEDICINES:**
        *   Suggest OTC meds (Paracetamol, Zinc, Saline drops) ONLY if relevant.
        *   **Calculated Dosage:** You MUST estimate dosage based on **${profile.weight}kg** (e.g., "Paracetamol ~15mg/kg per dose").
        *   *WARNING:* "Always verify exact dose with the pharmacist."

4.  **STEP 4: FOLLOW-UP & RED FLAGS:**
    *   **When to Return:** "Bring the child back immediately if: [List Danger Signs like 'Not able to drink', 'Vomiting everything', 'Convulsions']."
    *   **Routine Follow-up:** "If no improvement in 2 days, visit the clinic."

5.  **INTERNAL REFERENCE DOCS:**
    Use these guidelines to form your answers:
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
        return "⚠️ **Configuration Error: API Key Missing**\n\nTo use the AI Doctor features, you must configure your API Key.\n\n1. Create a file named `.env` in the root folder of your project.\n2. Add this line: `API_KEY=your_google_gemini_key_here`\n3. Restart the application terminal.\n\n*Note: This is a local environment setup requirement.*";
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
    1. If this is a new symptom, ask Rule-Out questions to verify it's not a serious related disease.
    2. Refer to the manual documents (IMNCI/AAP) in your training context.
    3. Give a Diet Plan suitable for a child weighing ${profile.weight}kg.
    4. Tell them exactly when to visit the doctor again.
    `;

    // Ensure AI is initialized
    const client = getAi();
    if (!client) throw new Error("AI Client failed to initialize");

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(profile),
        temperature: 0.3, // Low temp for medical accuracy
        tools: [{ googleSearch: {} }],
      }
    });

    let finalText = response.text || "I apologize, I cannot provide a consultation right now.";

    // Append Google Search Sources if available
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
        return "System Alert: Medical Database Connection Failed (API Key missing or invalid).";
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