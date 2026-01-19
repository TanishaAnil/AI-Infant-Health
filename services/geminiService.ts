
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, InfantProfile, Nutrients, AgeGroup } from "../types";
import { DOC_TITLES_FOR_SEARCH } from "./documents";
import { calculateRDAContribution, checkChokingHazards, generateSafetyScore, estimateVolumeDensity } from "./nutritionAlgorithms";

const getSystemInstruction = (profile: InfantProfile) => {
  return `You are "NurtureAI Medical Agent," a specialized pediatric clinical assistant.

REAL-TIME RETRIEVAL PIPELINE:
1. INPUT: Detect user language (${profile.language === 'te' ? 'Telugu' : 'English'}).
2. TRANSLATION: If input is Telugu, translate the parent's health concern into clinical English terms.
3. RETRIEVAL: You MUST use the Google Search tool to retrieve specific information from these authoritative sources or find their content online:
${DOC_TITLES_FOR_SEARCH}
4. ANALYSIS: Compare the retrieved clinical protocols (IMNCI/WHO/AAP) against the infant's vitals (${profile.weight}kg, ${profile.ageGroup}).
5. SYNTHESIS: Generate a response in ${profile.language === 'te' ? 'Telugu script' : 'English'}.

REQUIRED SECTIONS (NO MARKDOWN SYMBOLS - USE PLAIN TEXT):
- SUMMARY: Clinical assessment of the current situation.
- DIETARY GUIDANCE: Specific feeding/hydration advice.
- PROACTIVE QUESTIONS: Ask for missing information (e.g., activity level, urine count, breathing rate).
- MEDICINES AND SAFETY: Home care tips. Always add: "Only a physical doctor can prescribe medicine."
- EMERGENCY RED FLAGS: Clear list of signs for immediate ER visit.
- WHEN TO RETURN TO DOCTOR: Criteria for regular follow-up.

STRICT FORMATTING:
- REMOVE all asterisks (*), hashes (#), underscores (_), and other markdown.
- Use CAPITALIZED HEADERS for sections.
- Ensure the tone is empathetic but medically grounded.`;
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
PARENTS QUERY: "${query}"

INFANT STATS:
Name: ${profile.name}
Weight: ${profile.weight}kg
Age Group: ${profile.ageGroup}
History: ${chatHistory.slice(-500)}

RECENT VITALS LOGS:
${logSummary}

ACTION: 
1. Use Google Search to retrieve specific pediatric guidelines from the URLs provided in your system instructions.
2. Analyze if the logs indicate any WARNING or EMERGENCY based on IMNCI.
3. Provide a structured response in ${profile.language === 'te' ? 'Telugu' : 'English'}.
4. DO NOT USE ANY MARKDOWN CHARACTERS.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: getSystemInstruction(profile),
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
        }
    });
    
    const text = response.text || "I am currently unable to access the clinical data.";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter(Boolean) || [];

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Health Insight Error:", error);
    const isTe = profile.language === 'te';
    return { 
      text: isTe 
        ? "సాంకేతిక కారణాల వల్ల వైద్య సమాచారం అందుబాటులో లేదు." 
        : "Clinical retrieval service interrupted. Please try again.", 
      sources: [] 
    };
  }
};

export const analyzeMealImage = async (base64Image: string, profile: InfantProfile): Promise<Nutrients | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a Pediatric Nutritionist. Analyze this image for a ${profile.ageGroup} infant (Weight: ${profile.weight}kg).
    1. Identify ingredients.
    2. Assess texture (Puree, Soft Solid, Hard Solid, Chunky).
    3. Estimate volume in ml.
    4. Provide basic macro nutrients.
    Provide the result in JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            mainIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            textureAssessment: { type: Type.STRING, enum: ['Puree', 'Soft Solid', 'Hard Solid', 'Chunky'] },
            volumeEstimateMl: { type: Type.NUMBER }
          },
          required: ["calories", "protein", "carbs", "fat", "mainIngredients", "textureAssessment"]
        }
      }
    });

    const aiData = JSON.parse(response.text || "{}");
    if (!aiData.calories) return null;

    // RUN REAL-WORLD ALGORITHMS ON AI OUTPUT
    const isHazard = checkChokingHazards(aiData.mainIngredients, profile.ageGroup as AgeGroup);
    const safetyScore = generateSafetyScore(isHazard, aiData.textureAssessment, profile.ageGroup as AgeGroup);
    const rda = calculateRDAContribution(aiData.calories, profile.weight);
    const volume = aiData.volumeEstimateMl || estimateVolumeDensity(aiData.mainIngredients);

    return {
      ...aiData,
      chokingHazardDetected: isHazard,
      safetyScore: safetyScore,
      rdaContribution: rda,
      volumeEstimateMl: volume
    };

  } catch (error) {
    console.error("Meal analysis error:", error);
    return null;
  }
};

export const generateDynamicSuggestions = async (history: string, logs: LogEntry[], language: 'en' | 'te'): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Based on chat, suggest 3 pediatric follow-up questions in ${language === 'te' ? 'Telugu' : 'English'}. No markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          systemInstruction: "Generate follow-up pediatric questions.",
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
    const prompt = `Summarize infant health logs for ${profile.name}. NO MARKDOWN. Recent Logs: ${JSON.stringify(logs.slice(0, 10))}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: "Brief health status agent." }
    });
    return response.text || "";
  } catch {
    return "Status summary currently unavailable.";
  }
};

export const generateFormalReport = async (logs: LogEntry[], profile: InfantProfile, chatHistory: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Formal medical report for ${profile.name}. Retrieve guidelines via Search to verify classifications. Logs: ${JSON.stringify(logs.slice(0, 15))}. No markdown.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            systemInstruction: "Professional clinical reporting assistant.",
            tools: [{ googleSearch: {} }]
          }
        });
        return response.text || "Clinical report generation failed.";
      } catch {
        return "Error creating clinical record.";
      }
};
