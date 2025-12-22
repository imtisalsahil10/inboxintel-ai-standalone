import { GoogleGenAI, Type } from '@google/genai';
import { Email, AIAnalysis, Priority, Category } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
    if (!aiInstance) {
        // Always use new GoogleGenAI({apiKey: process.env.API_KEY}); as per guidelines
        aiInstance = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
    }
    return aiInstance;
};

// Analyze a batch of emails to prevent N+1 API calls
export const analyzeEmailBatch = async (emails: Omit<Email, 'analysis'>[]): Promise<Record<string, AIAnalysis>> => {
  // Use gemini-3-flash-preview for basic text tasks (summarization, categorization)
  const model = 'gemini-3-flash-preview';

  const prompt = `
    You are an expert executive assistant. Analyze the following emails.
    For each email, provide:
    1. A concise summary (max 2 sentences).
    2. A priority level (HIGH, MEDIUM, LOW) based on urgency and sender importance.
    3. An urgency score (0-100).
    4. A category (WORK, PERSONAL, NEWSLETTER, FINANCE, SPAM_LIKELY).
    5. A list of suggested action items (if any).
    6. Sentiment (POSITIVE, NEUTRAL, NEGATIVE).

    Input Data:
    ${JSON.stringify(emails.map(e => ({ 
        id: e.id, 
        sender: e.sender, 
        subject: e.subject, 
        // Strip HTML tags for clearer AI processing and token saving
        body: e.body.replace(/<[^>]*>?/gm, ' ').substring(0, 8000) 
    })))}
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              summary: { type: Type.STRING },
              priority: { type: Type.STRING, enum: [Priority.HIGH, Priority.MEDIUM, Priority.LOW] },
              urgencyScore: { type: Type.INTEGER },
              category: { type: Type.STRING, enum: [Category.WORK, Category.PERSONAL, Category.NEWSLETTER, Category.FINANCE, Category.SPAM_LIKELY] },
              actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentiment: { type: Type.STRING, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
            },
            required: ['id', 'summary', 'priority', 'urgencyScore', 'category', 'actionItems', 'sentiment'],
          },
        },
      },
    });

    // Access .text property directly, not as a method
    const rawData = response.text;
    if (!rawData) throw new Error("No data returned from AI");

    const parsedData = JSON.parse(rawData);
    
    // Convert array to map for easy lookup by ID
    const resultMap: Record<string, AIAnalysis> = {};
    parsedData.forEach((item: any) => {
        resultMap[item.id] = {
            summary: item.summary,
            priority: item.priority as Priority,
            urgencyScore: item.urgencyScore,
            category: item.category as Category,
            actionItems: item.actionItems,
            sentiment: item.sentiment
        };
    });

    return resultMap;

  } catch (error) {
    console.error("Error analyzing emails:", error);
    throw error;
  }
};

export const generateSmartReply = async (email: Email): Promise<string> => {
    // Use gemini-3-flash-preview for basic text tasks
    const model = 'gemini-3-flash-preview';
    
    // Strip tags for the prompt context
    const cleanBody = email.body.replace(/<[^>]*>?/gm, ' ');

    const prompt = `
        Draft a professional and context-aware reply to this email.
        Sender: ${email.senderName}
        Subject: ${email.subject}
        Body: "${cleanBody}"
        
        The reply should be concise, polite, and directly address the points in the email.
        If it's urgent, acknowledge the urgency.
        Do not include placeholders like "[Your Name]", just sign off as "AI Assistant".
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        // Access .text property directly
        return response.text || "Could not generate reply.";
    } catch (e) {
        console.error("Error generating reply", e);
        return "Error generating reply. Please try again.";
    }
}