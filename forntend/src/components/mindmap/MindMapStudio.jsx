import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    ReactFlowProvider,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Upload, FileText, Download, Save, Plus,
    Trash2, RefreshCw, ChevronLeft, ChevronRight,
    Zap, Layout, BrainCircuit, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import api from '../../services/api';
import '../../styles/MindMapStudio.css';

const initialNodes = [];
const initialEdges = [];

const MindMapStudio = ({ documentId: propDocId }) => {
    console.log('MindMapStudio component rendered with documentId:', propDocId);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [docId, setDocId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [fileName, setFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const reactFlowInstance = useReactFlow();

    // Connect nodes
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Generate mind map for the document
    const handleGenerateMindMap = useCallback(async () => {
        if (!propDocId) return;

        setLoading(true);
        try {
            const res = await api.post(`/documents/mindmap/${propDocId}`);
            if (res.data.success && res.data.mindMap) {
                setNodes(res.data.mindMap.nodes || []);
                setEdges(res.data.mindMap.edges || []);
                setFileName('Mind Map Generated');
            }
        } catch (err) {
            console.error("Error generating mind map:", err);
            alert("Failed to generate mind map. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [propDocId, setNodes, setEdges]);

    // Load existing document if ID provided
    useEffect(() => {
        if (propDocId) {
            setDocId(propDocId);
            setLoading(true);
            api.get(`/documents/mindmap/${propDocId}`)
                .then(res => {
                    if (res.data.success && res.data.mindMap) {
                        setNodes(res.data.mindMap.nodes || []);
                        setEdges(res.data.mindMap.edges || []);
                        setFileName('Document Loaded');
                    } else {
                        // If no mind map exists, try to generate one
                        handleGenerateMindMap();
                    }
                })
                .catch(err => {
                    console.error("Error fetching mind map:", err);
                    // If no mind map exists, try to generate one
                    handleGenerateMindMap();
                })
                .finally(() => setLoading(false));
        }
    }, [propDocId, handleGenerateMindMap, setNodes, setEdges]);

    // Drag & drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                handleFileUpload(file);
            } else {
                alert('Please drop a PDF file only.');
            }
        }
    }, [handleFileUpload]);

    // File upload handler
    const handleFileUpload = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const res = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocId(res.data._id);
            setFileName(file.name);
            // Generate mind map for the new document
            await handleGenerateMindMapForDoc(res.data._id);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Generate mind map for a specific doc ID
    const handleGenerateMindMapForDoc = async (docId) => {
        setLoading(true);
        try {
            const res = await api.post(`/documents/mindmap/${docId}`);
            if (res.data.success && res.data.mindMap) {
                setNodes(res.data.mindMap.nodes || []);
                setEdges(res.data.mindMap.edges || []);
            }
        } catch (err) {
            console.error("Error generating mind map:", err);
        } finally {
            setLoading(false);
        }
    };

    // Add new node
    const handleAddNode = () => {
        const newNode = {
            id: `node_${Date.now()}`,
            type: 'default',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: 'New Node' },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // Add root node
    const handleAddRootNode = () => {
        const rootNode = {
            id: `root_${Date.now()}`,
            type: 'default',
            position: { x: 400, y: 300 },
            data: { label: 'Root Node' },
            style: {
                background: '#14b8a6',
                color: '#fff',
                border: '2px solid #0f766e',
                fontSize: '16px',
                fontWeight: 'bold'
            }
        };
        setNodes((nds) => [...nds, rootNode]);
    };

    // Zoom in
    const handleZoomIn = () => {
        reactFlowInstance.zoomIn();
    };

    // Zoom out
    const handleZoomOut = () => {
        reactFlowInstance.zoomOut();
    };

    // Fit view
    const handleFitView = () => {
        reactFlowInstance.fitView();
    };

    // Layout nodes hierarchically
    const handleLayout = () => {
        if (nodes.length === 0) return;

        // Find root node (node with no incoming edges)
        const incomingEdges = edges.reduce((acc, edge) => {
            if (!acc[edge.target]) acc[edge.target] = [];
            acc[edge.target].push(edge.source);
            return acc;
        }, {});

        const rootNodeId = nodes.find(node => !incomingEdges[node.id])?.id || nodes[0].id;

        // Build adjacency list
        const adjacencyList = edges.reduce((acc, edge) => {
            if (!acc[edge.source]) acc[edge.source] = [];
            acc[edge.source].push(edge.target);
            return acc;
        }, {});

        // Calculate levels using BFS
        const levels = {};
        const visited = new Set();
        const queue = [{ id: rootNodeId, level: 0 }];

        while (queue.length > 0) {
            const { id, level } = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);
            levels[id] = level;

            if (adjacencyList[id]) {
                adjacencyList[id].forEach(childId => {
                    queue.push({ id: childId, level: level + 1 });
                });
            }
        }

        // Position nodes by level
        const levelNodes = {};
        Object.keys(levels).forEach(nodeId => {
            const level = levels[nodeId];
            if (!levelNodes[level]) levelNodes[level] = [];
            levelNodes[level].push(nodeId);
        });

        const newNodes = nodes.map(node => {
            const level = levels[node.id];
            if (level !== undefined) {
                const levelNodesList = levelNodes[level];
                const index = levelNodesList.indexOf(node.id);
                const totalInLevel = levelNodesList.length;
                const x = (index - (totalInLevel - 1) / 2) * 200 + 400;
                const y = level * 150 + 50;
                return { ...node, position: { x, y } };
            }
            return node;
        });

        setNodes(newNodes);
    };

    // Edit node label

    // Save mind map
    const handleSave = async () => {
        if (!propDocId) return;

        try {
            await api.put(`/documents/mindmap/${propDocId}`, {
                nodes,
                edges
            });
            alert("Mind map saved successfully!");
        } catch (err) {
            console.error("Error saving mind map:", err);
            alert("Failed to save mind map. Please try again.");
        }
    };

    // Export as PDF
    const handleExport = async () => {
        if (!propDocId) return;

        try {
            const response = await api.post('/documents/report/generate', {
                documentId: propDocId,
                reportType: 'mindmap'
            });
            // File downloads automatically
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export mind map. Please try again.");
        }
    };

    return (
        <div className="mindmap-studio">
            {/* Sidebar */}
            <div className={`studio-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <BrainCircuit size={20} />
                        {!sidebarOpen && <span>Mind Map</span>}
                    </div>
                    <button
                        className="toggle-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {sidebarOpen && (
                    <div className="sidebar-content">
                        <div className="control-group">
                            <h3>Actions</h3>
                            <button className="btn-primary" onClick={handleGenerateMindMap} disabled={loading}>
                                <Zap size={16} />
                                Generate Mind Map
                            </button>
                            <button className="btn-primary" onClick={handleAddNode}>
                                <Plus size={16} />
                                Add Node
                            </button>
                            <button className="btn-primary" onClick={handleAddRootNode}>
                                <BrainCircuit size={16} />
                                Add Root Node
                            </button>
                            <button className="btn-secondary" onClick={handleSave}>
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>

                        <div className="control-group">
                            <h3>View</h3>
                            <button className="btn-secondary" onClick={handleZoomIn}>
                                <ZoomIn size={16} />
                                Zoom In
                            </button>
                            <button className="btn-secondary" onClick={handleZoomOut}>
                                <ZoomOut size={16} />
                                Zoom Out
                            </button>
                            <button className="btn-secondary" onClick={handleFitView}>
                                <Maximize size={16} />
                                Fit View
                            </button>
                        </div>

                        <div className="control-group">
                            <h3>Export</h3>
                            <button className="btn-accent" onClick={handleExport}>
                                <Download size={16} />
                                Export as PDF
                            </button>
                        </div>

                        <div className="control-group">
                            <h3>Stats</h3>
                            <div className="stat-row">
                                <span>Nodes:</span>
                                <span>{nodes.length}</span>
                            </div>
                            <div className="stat-row">
                                <span>Connections:</span>
                                <span>{edges.length}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Canvas Area */}
            <div className="studio-canvas">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={{ default: ({ data }) => (
                            <div style={{
                                background: '#fff',
                                color: '#1e293b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '10px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                minWidth: '120px',
                                textAlign: 'center',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {data.label}
                            </div>
                        )}}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        fitView
                        attributionPosition="bottom-left"
                        proOptions={{ hideAttribution: true }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Controls />
                        <MiniMap
                            nodeColor={(n) => {
                                if (n.type === 'selectorNode') return '#fff';
                                return '#fff';
                            }}
                            maskColor="rgba(241, 245, 249, 0.7)"
                        />
                        <Background color="#cbd5e1" gap={20} />

                        {/* Floating Toolbar */}
                        <Panel position="top-center" className="floating-toolbar">
                            <button title="Layout" onClick={handleLayout}>
                                <Layout size={20} />
                            </button>
                            <div className="divider"></div>
                            <button title="Reset" onClick={() => setNodes([])}>
                                <RefreshCw size={20} />
                            </button>
                            <button title="Delete Selected" onClick={() => {
                                const selected = nodes.filter(n => n.selected);
                                setNodes(nds => nds.filter(n => !n.selected));
                            }}>
                                <Trash2 size={20} />
                            </button>
                        </Panel>
                    </ReactFlow>
                </ReactFlowProvider>

                {/* Empty State / Upload Prompt */}
                {!docId && !loading && (
                    <div
                        className={`empty-state-overlay ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="upload-card">
                            <div className="icon-circle">
                                <BrainCircuit size={40} color="#14b8a6" />
                            </div>
                            <h2>Start Mapping</h2>
                            <p>Drag & drop a PDF here or click to select</p>
                            <button className="btn-large" onClick={() => fileInputRef.current.click()}>
                                Select PDF File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".pdf"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleFileUpload(file);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <p>Analyzing Document Structure...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MindMapStudio;
