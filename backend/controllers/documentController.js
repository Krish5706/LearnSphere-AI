const { GoogleGenerativeAI } = require("@google/generative-ai");
const Document = require("../models/Document");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. UPLOAD & ANALYZE
exports.uploadAndAnalyze = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });

        const user = await User.findById(req.user._id);
        
        if (user.credits <= 0 && !user.isSubscribed) {
            return res.status(403).json({ message: "No credits left. Please upgrade." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const pdfData = fs.readFileSync(req.file.path).toString("base64");

        const prompt = `
            Analyze this PDF and provide:
            1. A short summary (max 3 sentences).
            2. 5 key bullet points of insights.
            3. A quiz with 3 multiple-choice questions in this JSON format:
               {"summary": "...", "keyPoints": ["...", "..."], "quizzes": [{"question": "...", "options": ["...", "..."], "correctAnswer": "...", "explanation": "..."}]}
            Return ONLY the raw JSON string.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: pdfData, mimeType: "application/pdf" } }
        ]);

        // Clean AI response (removes ```json ... ``` blocks if present)
        let textResponse = result.response.text();
        const cleanJson = textResponse.replace(/```json|```/gi, "").trim();
        const aiResponse = JSON.parse(cleanJson);

        const newDoc = await Document.create({
            user: user._id,
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            summary: { short: aiResponse.summary },
            keyPoints: aiResponse.keyPoints,
            quizzes: aiResponse.quizzes,
            mindMap: { nodes: [], edges: [] }
        });

        if (!user.isSubscribed) {
            user.credits -= 1;
            await user.save();
        }

        res.status(201).json(newDoc);
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ message: "Error processing document with AI" });
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