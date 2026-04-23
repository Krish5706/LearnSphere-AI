const MindMap = require('../models/MindMap');
const Document = require('../models/Document');
const User = require('../models/User');
const pdfParseService = require('../services/pdfParseService');
const MindMapGeminiService = require('../services/mindMapGeminiService');
const { treeToMindMapGraph, MAX_NODE_COUNT } = require('../utils/mindMapTransformer');

const MAX_CLIENT_NODE_COUNT = 20;

const sanitizeGraph = (nodes = [], edges = []) => {
    const limitedNodes = Array.isArray(nodes) ? nodes.slice(0, MAX_CLIENT_NODE_COUNT) : [];
    const nodeIds = new Set(limitedNodes.map((node) => String(node.id)));

    const sanitizedNodes = limitedNodes.map((node) => ({
        id: String(node.id),
        data: {
            label: String(node?.data?.label || 'Untitled').trim() || 'Untitled',
        },
        position: {
            x: Number(node?.position?.x ?? 0),
            y: Number(node?.position?.y ?? 0),
        },
    }));

    const sanitizedEdges = (Array.isArray(edges) ? edges : [])
        .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
        .slice(0, MAX_CLIENT_NODE_COUNT * 2)
        .map((edge) => ({
            id: String(edge.id || `e-${edge.source}-${edge.target}`),
            source: String(edge.source),
            target: String(edge.target),
        }));

    return { sanitizedNodes, sanitizedEdges };
};

const resolveDocumentText = async ({ documentText, documentId, userId }) => {
    if (documentText && documentText.trim()) {
        return documentText.trim();
    }

    if (!documentId) {
        return '';
    }

    const doc = await Document.findOne({ _id: documentId, user: userId });
    if (!doc) {
        return '';
    }

    if (doc?.pdfMetadata?.extractedText?.trim()) {
        return doc.pdfMetadata.extractedText.trim();
    }

    if (!doc.fileUrl) {
        return '';
    }

    const fullText = await pdfParseService.extractPdfText(doc.fileUrl);
    return (fullText || '').trim();
};

exports.generateMindMap = async (req, res) => {
    try {
        const { documentText, userId, documentId } = req.body;
        const effectiveUserId = req.user._id;

        if (userId && String(userId) !== String(effectiveUserId)) {
            return res.status(403).json({ message: 'Unauthorized userId for this request' });
        }

        const user = await User.findById(effectiveUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isSubscribed && user.credits <= 0) {
            return res.status(403).json({ message: "You've exhausted your free credits. Please upgrade to Pro." });
        }

        const resolvedDocumentText = await resolveDocumentText({
            documentText,
            documentId,
            userId: effectiveUserId,
        });

        if (!resolvedDocumentText) {
            return res.status(400).json({ message: 'Document text is required (or provide a valid documentId)' });
        }

        const geminiService = new MindMapGeminiService(process.env.GEMINI_API_KEY);
        const { tree, parseError } = await geminiService.generateMindMapTree(resolvedDocumentText);

        if (parseError || !tree) {
            return res.status(422).json({
                message: 'Gemini returned invalid JSON for mind map generation. Please regenerate.',
                fallback: true,
            });
        }

        const { nodes, edges } = treeToMindMapGraph(tree, {
            maxNodes: MAX_NODE_COUNT,
        });

        const payload = {
            userId: effectiveUserId,
            documentId,
            nodes,
            edges,
        };

        let savedMindMap = null;
        if (documentId) {
            savedMindMap = await MindMap.findOneAndUpdate(
                { userId: effectiveUserId, documentId },
                payload,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }

        let updatedUser = user;
        if (!user.isSubscribed) {
            updatedUser = await User.findByIdAndUpdate(
                effectiveUserId,
                { $inc: { credits: -1 } },
                { new: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Mind map generated successfully',
            data: {
                nodes,
                edges,
                mindMapId: savedMindMap?._id || null,
            },
            user: updatedUser,
        });
    } catch (error) {
        console.error('Mind map generation error:', error);
        return res.status(500).json({
            message: error.message || 'Failed to generate mind map',
        });
    }
};

exports.saveMindMap = async (req, res) => {
    try {
        const { userId, documentId, nodes, edges } = req.body;
        const effectiveUserId = req.user._id;

        if (userId && String(userId) !== String(effectiveUserId)) {
            return res.status(403).json({ message: 'Unauthorized userId for this request' });
        }

        if (!documentId) {
            return res.status(400).json({ message: 'documentId is required' });
        }

        const { sanitizedNodes, sanitizedEdges } = sanitizeGraph(nodes, edges);
        if (!sanitizedNodes.length) {
            return res.status(400).json({ message: 'At least one node is required to save a mind map' });
        }

        const saved = await MindMap.findOneAndUpdate(
            { userId: effectiveUserId, documentId },
            {
                userId: effectiveUserId,
                documentId,
                nodes: sanitizedNodes,
                edges: sanitizedEdges,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Mind map saved successfully',
            data: saved,
        });
    } catch (error) {
        console.error('Save mind map error:', error);
        return res.status(500).json({
            message: error.message || 'Failed to save mind map',
        });
    }
};

exports.getMindMapByDocument = async (req, res) => {
    try {
        const { docId } = req.params;
        const effectiveUserId = req.user._id;

        const mindMap = await MindMap.findOne({
            userId: effectiveUserId,
            documentId: docId,
        }).sort({ updatedAt: -1 });

        if (!mindMap) {
            return res.status(404).json({ message: 'Mind map not found for this document' });
        }

        return res.status(200).json({
            success: true,
            data: mindMap,
        });
    } catch (error) {
        console.error('Get mind map error:', error);
        return res.status(500).json({
            message: error.message || 'Failed to fetch mind map',
        });
    }
};
