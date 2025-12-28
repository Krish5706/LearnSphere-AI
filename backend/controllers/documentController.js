const { GoogleGenerativeAI } = require("@google/generative-ai");
const Document = require("../models/Document");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Validate API key before initializing
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing from environment variables!");
    console.error("Please add GEMINI_API_KEY to your .env file in the backend directory.");
}

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// 1. UPLOAD & ANALYZE
exports.uploadAndAnalyze = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });

        // Check if API key is configured
        if (!genAI || !process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                message: "AI service is not configured. Please set GEMINI_API_KEY in your .env file." 
            });
        }

        const user = await User.findById(req.user._id);
        if (user.credits <= 0 && !user.isSubscribed) {
            return res.status(403).json({ message: "No credits left." });
        }

        // Using Gemini model - defaults to free-tier compatible model
        // Can be overridden via GEMINI_MODEL env var
        // Free tier options: gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash (may have quota limits)
        // Paid tier options: gemini-3-pro-preview, gemini-3-flash-preview
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
        console.log(`🤖 Using Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const pdfData = fs.readFileSync(req.file.path).toString("base64");

        const prompt = `
            Analyze this PDF and provide:
            1. A short summary (max 3 sentences).
            2. 5 key bullet points.
            3. A quiz with 3 MCQs.
            4. A Mind Map structure with 'nodes' and 'edges'. 
               - The 'nodes' should have id, label, and type ('root', 'main', or 'sub').
               - The 'edges' should connect these IDs.
            
            Return ONLY a valid JSON object like this:
            {
              "summary": "...",
              "keyPoints": ["..."],
              "quizzes": [...],
              "mindMap": {
                "nodes": [{"id": "1", "label": "Topic", "type": "root"}, ...],
                "edges": [{"id": "e1-2", "source": "1", "target": "2"}, ...]
              }
            }
        `;

        // Generate content with PDF
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { data: pdfData, mimeType: "application/pdf" } }
                ]
            }]
        });

        let textResponse = result.response.text();
        const cleanJson = textResponse.replace(/```json|```/gi, "").trim();
        const aiResponse = JSON.parse(cleanJson);

        // Save with mindMap data
        const newDoc = await Document.create({
            user: user._id,
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            summary: { short: aiResponse.summary },
            keyPoints: aiResponse.keyPoints,
            quizzes: aiResponse.quizzes,
            mindMap: aiResponse.mindMap // Saved here!
        });

        if (!user.isSubscribed) {
            // Use findByIdAndUpdate to avoid triggering password hashing pre-save hook
            await User.findByIdAndUpdate(user._id, { $inc: { credits: -1 } });
        }

        res.status(201).json(newDoc);
    } catch (err) {
        console.error("AI Error:", err);
        
        // Provide more specific error messages
        let errorMessage = "Analysis failed";
        let statusCode = 500;
        
        if (err.status === 429 || (err.message && err.message.includes("quota"))) {
            // Quota/Rate limit exceeded
            statusCode = 429;
            const retryDelay = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || "a few seconds";
            errorMessage = `API quota exceeded. The model "${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}" is not available on your current plan. Please try: 1) Wait ${retryDelay} and retry, 2) Use a free-tier model (gemini-1.5-pro, gemini-1.5-flash), or 3) Upgrade your Google AI Studio plan.`;
        } else if (err.message && err.message.includes("API key not valid")) {
            errorMessage = "Invalid API key. Please check your GEMINI_API_KEY in the .env file.";
        } else if (err.message && err.message.includes("API_KEY_INVALID")) {
            errorMessage = "Invalid or expired API key. Please update your GEMINI_API_KEY in the .env file.";
        } else if (err.message && (err.message.includes("not found") || err.message.includes("404"))) {
            errorMessage = `Model not found. The model "${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}" may not be available. Try: gemini-1.5-flash, gemini-1.5-pro, or gemini-2.5-flash. Run "node list-models.js" to see available models for your API key.`;
        } else if (err.message) {
            errorMessage = `Analysis failed: ${err.message}`;
        }
        
        res.status(statusCode).json({ message: errorMessage });
    }
};

// 2. FETCH USER DOCUMENTS
exports.getUserDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({ message: "Error fetching documents" });
    }
};

// 3. DELETE DOCUMENT (Fixes your SyntaxError)
exports.deleteDocument = async (req, res) => {
    try {
        // Find doc and verify owner
        const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });

        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Delete local file from uploads folder
        if (fs.existsSync(doc.fileUrl)) {
            fs.unlinkSync(doc.fileUrl);
        }

        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting document" });
    }
};