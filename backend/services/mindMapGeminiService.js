const { GoogleGenerativeAI } = require('@google/generative-ai');

const MINDMAP_PROMPT_TEMPLATE = `Convert the following document into a clean hierarchical mind map.

Rules:

* Output ONLY valid JSON
* Do NOT include explanations
* Keep structure simple and readable
* Maximum 12-15 nodes
* Depth: max 3 levels
* Avoid duplication
* Focus on understanding, not full detail

Format:
{
"title": "Main Topic",
"children": [
{
"title": "Subtopic",
"children": [
{ "title": "Point" }
]
}
]
}

Document:
<<<DOCUMENT_TEXT>>>`;

const parseJsonSafely = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        return null;
    }

    const cleaned = rawText.replace(/```json|```/gi, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');

        if (start === -1 || end === -1 || end <= start) {
            return null;
        }

        const candidate = cleaned.slice(start, end + 1);

        try {
            return JSON.parse(candidate);
        } catch (nestedError) {
            return null;
        }
    }
};

const isValidMindMapTree = (tree) => {
    if (!tree || typeof tree !== 'object') {
        return false;
    }

    if (typeof tree.title !== 'string' || !tree.title.trim()) {
        return false;
    }

    if (tree.children !== undefined && !Array.isArray(tree.children)) {
        return false;
    }

    return true;
};

class MindMapGeminiService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required for mind map generation');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    async generateMindMapTree(documentText) {
        if (!documentText || !documentText.trim()) {
            throw new Error('Document text is required');
        }

        const prompt = MINDMAP_PROMPT_TEMPLATE.replace('<<<DOCUMENT_TEXT>>>', documentText);
        const result = await this.model.generateContent(prompt);
        const responseText = result?.response?.text?.() || '';

        const parsed = parseJsonSafely(responseText);

        if (!isValidMindMapTree(parsed)) {
            return {
                tree: null,
                parseError: true,
                rawResponse: responseText,
            };
        }

        return {
            tree: parsed,
            parseError: false,
            rawResponse: responseText,
        };
    }
}

module.exports = MindMapGeminiService;
