const mongoose = require('mongoose');

const mindMapSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
            index: true,
        },
        nodes: [
            {
                id: { type: String, required: true },
                data: {
                    label: { type: String, required: true },
                },
                position: {
                    x: { type: Number, required: true },
                    y: { type: Number, required: true },
                },
            },
        ],
        edges: [
            {
                id: { type: String, required: true },
                source: { type: String, required: true },
                target: { type: String, required: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

mindMapSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('MindMap', mindMapSchema);
