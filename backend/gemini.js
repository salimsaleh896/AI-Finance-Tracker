const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function categorizeTransaction(title) {
    try {
        console.log(`🧠 Calling Gemini API for: "${title}"...`);

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // SHARPENED PROMPT: Specifically addresses "tools" vs "food"
        const prompt = `Categorize the expense title: "${title}". 
        Choose ONLY ONE from this list: Food, Transport, Entertainment, Shopping, Health, Utilities, Salary.

        Rules:
        1. If it is a tool, hardware, or general object (like a panga, hammer, or phone), use "Shopping".
        2. If it is a specific food, grocery, or restaurant, use "Food".
        3. If it is a bill (electricity, water, internet), use "Utilities".
        4. If you are totally unsure, use "Shopping".
        
        Reply with ONLY the category word.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const category = response.text().trim();

        console.log(`✅ AI Categorized as: ${category}`);
        return category;

    } catch (error) {
        console.error("⚠️ AI Error - Using Fallback:", error.message);

        // SMART LOGiC(Backup for when API is down)
        const input = title.toLowerCase();
        if (input.includes('movie') || input.includes('cinema') || input.includes('netflix')) return 'Entertainment';
        if (input.includes('panga') || input.includes('tool') || input.includes('amazon') || input.includes('store')) return 'Shopping';
        if (input.includes('food') || input.includes('juice') || input.includes('mcdonalds') || input.includes('pizza')) return 'Food';
        if (input.includes('uber') || input.includes('taxi') || input.includes('bus')) return 'Transport';

        return "Shopping";
    }
}

module.exports = { categorizeTransaction };