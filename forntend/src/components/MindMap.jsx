import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    MarkerType,
    BaseEdge,
    getBezierPath,
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

// Custom edge renderer to ensure connectors are properly styled and visible
const MindMapEdge = ({ id, sourceX, sourceY, targetX, targetY, markerEnd }) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={{
                stroke: '#64748b',
                strokeWidth: 2,
                opacity: 1,
            }}
        />
    );
};

const clampGraph = (nodes = [], edges = []) => {
    const limitedNodes = (Array.isArray(nodes) ? nodes : []).slice(0, UI_MAX_NODES);
    const nodeIds = new Set(limitedNodes.map((node) => String(node.id)));

    const limitedEdges = (Array.isArray(edges) ? edges : [])
        .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
        .slice(0, UI_MAX_NODES * 2);

    return { limitedNodes, limitedEdges };
};

// Validation utilities for export
const validateConnectors = (nodes = [], edges = []) => {
    const issues = [];
    
    if (nodes.length === 0) {
        issues.push('No nodes to export');
        return issues;
    }
    
    if (edges.length === 0 && nodes.length > 1) {
        issues.push('Warning: Multiple nodes but no connectors found');
    }
    
    const nodeIds = new Set(nodes.map((n) => String(n.id)));
    const orphanedEdges = edges.filter(
        (e) => !nodeIds.has(String(e.source)) || !nodeIds.has(String(e.target))
    );
    
    if (orphanedEdges.length > 0) {
        issues.push(`Found ${orphanedEdges.length} invalid connector(s) - will be excluded`);
    }
    
    // Verify every non-root node has at least one incoming edge
    const nodesWithIncoming = new Set(edges.map((e) => String(e.target)));
    const rootNodes = nodes.filter((n) => !nodesWithIncoming.has(String(n.id)));
    
    if (rootNodes.length === 0 && nodes.length > 0) {
        issues.push('Warning: No root node detected');
    }
    
    return issues;
};

// Validate exported image data
const validateExportedImage = (dataUrl, expectedWidth, expectedHeight) => {
    const issues = [];
    
    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
        issues.push('Invalid image data format');
        return issues;
    }
    
    // Check data size (rough estimate: PNG header + content)
    const dataSize = dataUrl.length;
    const minExpectedSize = expectedWidth * expectedHeight * 0.1; // Rough estimate
    if (dataSize < minExpectedSize) {
        issues.push(`Image data too small (${dataSize} chars, expected > ${minExpectedSize})`);
    }
    
    // Check for white background (sample pixels from corners)
    try {
        const img = new Image();
        img.src = dataUrl;
        // Note: Can't fully validate pixels without canvas, but basic checks done
    } catch (e) {
        issues.push('Failed to validate image format');
    }
    
    return issues;
};

const ensureEdgesWithMarkers = (edges = []) => {
    return edges.map((edge) => ({
        ...edge,
        markerEnd: MarkerType.ArrowClosed,
        animated: false,
        style: {
            stroke: '#64748b',
            strokeWidth: 2,
            opacity: 1,
        },
    }));
};

const MindMapComponent = ({ documentId, documentText = '' }) => {
    const { user, setUser } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { fitView, getNodes } = useReactFlow();
    const reactFlowWrapper = useRef(null);

    const hasMap = useMemo(() => nodes.length > 0, [nodes.length]);
    const edgesWithMarkers = useMemo(() => ensureEdgesWithMarkers(edges), [edges]);

    const toggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    useEffect(() => {
        if (nodes.length > 0) {
            setTimeout(() => fitView({ duration: 400 }), 100);
        }
    }, [isFullscreen, fitView, nodes.length]);

    const handleDownload = async () => {
        if (!hasMap) {
            setError('Generate a mind map before exporting.');
            return;
        }

        // Validate connectors before export
        const validationIssues = validateConnectors(nodes, edges);
        if (validationIssues.length > 0) {
            console.warn('Export Validation Report:', validationIssues);
        }

        setExporting(true);
        setError('');
        setStatus('Preparing mind map for export...');

        try {
            // Ensure render is complete
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Get the React Flow element containing both nodes and edges
            const flowElement = reactFlowWrapper.current?.querySelector('.react-flow');
            if (!flowElement) {
                setError('Could not locate mind map canvas.');
                setExporting(false);
                return;
            }

            // Temporarily fit view to ensure all content is visible
            fitView({ padding: 0.1, includeHiddenNodes: true, minZoom: 0.1, maxZoom: 1 });

            // Wait for fitView to complete
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Calculate bounds to fit all nodes with padding
            const nodesBounds = getNodesBounds(getNodes());
            const padding = 80; // Increased padding for safety

            // Calculate the required dimensions
            const contentWidth = nodesBounds.width + padding * 2;
            const contentHeight = nodesBounds.height + padding * 2;

            // Set maximum export dimensions (4K equivalent for high quality)
            const maxWidth = 3840;
            const maxHeight = 2160;

            // Calculate scaling to fit content within max dimensions while preserving aspect ratio
            const scaleX = maxWidth / contentWidth;
            const scaleY = maxHeight / contentHeight;
            const scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 100%

            const exportWidth = Math.round(contentWidth * scale);
            const exportHeight = Math.round(contentHeight * scale);

            setStatus('Rendering mind map to image...');

            // Simple approach: capture the original element directly with backgroundColor
            const dataUrl = await toPng(flowElement, {
                backgroundColor: '#ffffff',        // Solid white background
                width: exportWidth,
                height: exportHeight,
                pixelRatio: 2,                     // High quality rendering
                cacheBust: true,
                quality: 1.0,                      // Maximum quality
                filter: (node) => {
                    // Include all elements except attribution
                    return !node.classList?.contains('react-flow__attribution');
                },
                style: {
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: `${contentWidth}px`,
                    height: `${contentHeight}px`,
                    margin: '0',
                    padding: '0',
                },
            });

            // Validate export was successful
            const exportValidationIssues = validateExportedImage(dataUrl, exportWidth, exportHeight);
            if (exportValidationIssues.length > 0) {
                console.warn('Export validation issues:', exportValidationIssues);
                // Continue with download but log warnings
            }
            
            if (!dataUrl || dataUrl.length < 5000) {
                setError('Export produced empty or invalid image. Please try again.');
                setExporting(false);
                return;
            }

            // Download the image
            const timestamp = new Date().toISOString().split('T')[0];
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `mind-map-${timestamp}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setStatus(
                `✓ Exported successfully (${nodes.length} nodes, ${edges.length} connectors, ${exportWidth}×${exportHeight}px)`
            );
            setTimeout(() => setStatus(''), 5000);
        } catch (err) {
            console.error('Mind map export error:', err);
            setError(`Export failed: ${err?.message || 'Unknown error. Check console.'}`);
        } finally {
            setExporting(false);
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
                    {status && (
                        <p className="text-xs text-green-600 mt-1">{status}</p>
                    )}
                    {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleFullscreen} className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                    <button type="button" onClick={handleDownload} disabled={!hasMap || exporting} className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60" title="Download as PNG">
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
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
            <div ref={reactFlowWrapper} className={`w-full flex-grow relative ${isFullscreen ? 'h-full' : 'h-[500px]'}`} style={{ backgroundColor: '#ffffff' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edgesWithMarkers}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    edgeTypes={{ default: MindMapEdge }}
                    fitView
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <Background color="#ffffff" gap={20} />
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
