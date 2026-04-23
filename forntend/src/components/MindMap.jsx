import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toPng } from 'html-to-image';
import {
    addEdge,
    Background,
    Controls,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    getNodesBounds,
    getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Download,
    Loader2,
    Maximize,
    Minimize,
    RefreshCcw,
    Save,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    generateMindMap,
    getMindMapByDocument,
    saveMindMap,
} from '../services/api';

const UI_MAX_NODES = 20;

const clampGraph = (nodes = [], edges = []) => {
    const limitedNodes = (Array.isArray(nodes) ? nodes : []).slice(0, UI_MAX_NODES);
    const nodeIds = new Set(limitedNodes.map((node) => String(node.id)));

    const limitedEdges = (Array.isArray(edges) ? edges : [])
        .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
        .slice(0, UI_MAX_NODES * 2);

    return { limitedNodes, limitedEdges };
};

const MindMapComponent = ({ documentId, documentText = '' }) => {
    const { user, setUser } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { fitView, getNodes } = useReactFlow();

    const hasMap = useMemo(() => nodes.length > 0, [nodes.length]);

    const toggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    useEffect(() => {
        if (nodes.length > 0) {
            setTimeout(() => fitView({ duration: 400 }), 100);
        }
    }, [isFullscreen, fitView, nodes.length]);

    const handleDownload = () => {
        const imageWidth = 1920;
        const imageHeight = 1080;
        const nodesBounds = getNodesBounds(getNodes());
        const viewportTransform = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);

        const viewport = document.querySelector('.react-flow__viewport');
        if (viewport) {
            toPng(viewport, {
                backgroundColor: '#ffffff',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.zoom})`,
                },
            }).then((dataUrl) => {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'mind-map.png';
                a.click();
            });
        }
    };

    const loadSavedMindMap = useCallback(async () => {
        if (!documentId) {
            return false;
        }
        try {
            const response = await getMindMapByDocument(documentId);
            const payload = response?.data?.data;
            if (!payload || !payload.nodes || payload.nodes.length === 0) {
                return false;
            }
            const { limitedNodes, limitedEdges } = clampGraph(payload.nodes, payload.edges);
            setNodes(limitedNodes);
            setEdges(limitedEdges);
            setStatus('Loaded saved mind map.');
            return true;
        } catch (err) {
            if (err?.response?.status !== 404) {
                setError(err?.response?.data?.message || 'Failed to load saved mind map.');
            }
            return false;
        }
    }, [documentId, setEdges, setNodes]);

    useEffect(() => {
        const initMindMap = async () => {
            const hasSavedMap = await loadSavedMindMap();
            if (!hasSavedMap) {
                await handleGenerate(false);
            }
        };
        initMindMap();
    }, [loadSavedMindMap]);

    const handleGenerate = async (regenerate = false) => {
        if (!documentId && !documentText?.trim()) {
            setError('Document text is not available yet.');
            return;
        }
        setLoading(true);
        setError('');
        setStatus('');
        try {
            const response = await generateMindMap({ documentId, documentText, userId: user?._id });
            const payload = response?.data?.data || {};
            const { limitedNodes, limitedEdges } = clampGraph(payload.nodes, payload.edges);
            setNodes(limitedNodes);
            setEdges(limitedEdges);
            if (response?.data?.user) setUser(response.data.user);
            setStatus(regenerate ? 'Mind map regenerated.' : 'Mind map generated successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to generate mind map. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!documentId) {
            setError('Document ID is required to save.');
            return;
        }
        if (!nodes.length) {
            setError('Generate or edit a mind map before saving.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await saveMindMap({ documentId, userId: user?._id, nodes, edges });
            setStatus('Mind map saved successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save mind map.');
        } finally {
            setSaving(false);
        }
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeDoubleClick = useCallback((_event, node) => {
        const current = node?.data?.label || '';
        const updated = window.prompt('Edit node label:', current);
        if (updated === null) return;
        const nextLabel = updated.trim();
        if (!nextLabel) return;
        setNodes((prev) =>
            prev.map((item) =>
                item.id === node.id ? { ...item, data: { ...item.data, label: nextLabel } } : item
            )
        );
    }, [setNodes]);

    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
                isFullscreen ? 'fixed inset-0 z-50 w-full h-full' : 'relative'
            }`}
        >
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Document Mind Map</h3>
                    <p className="text-xs text-slate-500">
                        Double-click any node to edit text. Drag nodes to adjust layout.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleFullscreen} className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                    <button type="button" onClick={handleDownload} disabled={!hasMap} className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60" title="Download as PNG">
                        <Download size={16} />
                    </button>
                    <button type="button" onClick={() => handleGenerate(false)} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generate Mind Map
                    </button>
                    <button type="button" onClick={() => handleGenerate(true)} disabled={loading} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2">
                        <RefreshCcw size={14} />
                        Regenerate
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving || !hasMap} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Mind Map
                    </button>
                </div>
            </div>
            <div className={`w-full flex-grow relative ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    fitView
                >
                    <Background />
                    <Controls className="flex flex-col" />
                </ReactFlow>
            </div>
        </div>
    );
};

const MindMap = (props) => (
    <ReactFlowProvider>
        <MindMapComponent {...props} />
    </ReactFlowProvider>
);

export default MindMap;
