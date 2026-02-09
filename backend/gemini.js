const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check if API Key exists to prevent crash
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in Environment Variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function categorizeTransaction(title) {
    try {
        // Use the faster, more stable flash model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Categorize this expense title: "${title}". 
        Respond with ONLY ONE word from this list: Food, Transport, Shopping, Bills, Entertainment, Health, Other. 
        Do not include any punctuation or extra text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().replace(/[^a-zA-Z]/g, ''); // Clean extra characters

        console.log(`🤖 AI Suggestion for "${title}": ${text}`);
        return text || "Other";

    } catch (error) {
        // SAFETY CATCH: If AI fails, return 'Other' so the database still saves
        console.error("⚠️ Gemini AI Error:", error.message);
        return "Other";
    }
}

module.exports = { categorizeTransaction };