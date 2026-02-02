import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        // Using alias for latest stable version to avoid deprecation/quota issues
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
    }
}

export const GeminiService = {
    isConfigured: () => !!API_KEY && !!model,

    async generateText(prompt: string): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw error;
        }
    },

    async analyzeSalary(salaryData: any): Promise<string> {
        const prompt = `
            Act as a wise financial advisor. Analyze this salary data and provide 3 brief, actionable insights in Arabic:
            ${JSON.stringify(salaryData)}
        `;
        return this.generateText(prompt);
    },


    async chat(history: { role: "user" | "model", parts: string }[], newMessage: string, systemContext?: string): Promise<{ text: string, action?: any }> {
        if (!this.isConfigured()) {
            throw new Error("Gemini API Key is missing.");
        }

        try {
            // Fix history format for GoogleGenerativeAI SDK
            // The SDK expects parts to be ContentPart[] or string depending on version,
            // but for safety in new SDKs, we format as [{ text: "..." }]
            const chatHistory = history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }]
            }));

            // Using gemini-1.5-flash as it is known to be stable and available
            const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });

            const chat = model.startChat({
                history: chatHistory,
            });

            // Enhanced prompt with system context
            const enhancedPrompt = `
                ${systemContext ? `CONTEXT: ${systemContext}` : ''}
                
                USER INPUT: "${newMessage}"
                
                You are Barakah Genius, an intelligent assistant.
                
                RULES:
                1. If the user asks to DO something (e.g., "Add task", "Booking appointment"), you MUST respond in JSON format ONLY:
                   { "action": "create_task" | "create_appointment", "data": { ...extracted_fields } }
                
                2. If the user asks a QUESTION, respond normally in plain text (Arabic).
                
                3. Date Handling: Assume current year 2026. If user says "tomorrow", calculate date based on today.
            `;

            const result = await chat.sendMessage(enhancedPrompt);
            const response = await result.response;
            const text = response.text();

            // Try to parse JSON action
            try {
                // Find JSON object if mixed with text
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const actionData = JSON.parse(jsonMatch[0]);
                    // Validate basic action structure
                    if (actionData.action && (actionData.action === 'create_task' || actionData.action === 'create_appointment')) {
                        return { text: "جاري التنفيذ...", action: actionData };
                    }
                }
            } catch (e) {
                // JSON parse failed, treat as normal text
            }

            return { text };
        } catch (error) {
            console.error("Gemini Chat Error:", error);
            throw error;
        }
    }
};
