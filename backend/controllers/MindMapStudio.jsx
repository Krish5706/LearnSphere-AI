import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
    Upload, FileText, Download, Save, Plus, 
    Trash2, RefreshCw, ChevronLeft, ChevronRight, 
    Zap, Layout 
} from 'lucide-react';
import axios from 'axios';
import './MindMapStudio.css';

const initialNodes = [];
const initialEdges = [];

const MindMapStudio = ({ documentId: propDocId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [docId, setDocId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    // Connect nodes
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // 0. Load existing document if ID provided
    useEffect(() => {
        if (propDocId) {
            setDocId(propDocId);
            setLoading(true);
            axios.get(`/api/documents/mindmap/${propDocId}`)
                .then(res => {
                    if (res.data.success && res.data.mindMap) {
                        setNodes(res.data.mindMap.nodes || []);
                        setEdges(res.data.mindMap.edges || []);
                        setFileName('Document Loaded'); 
                    }
                })
                .catch(err => console.error("Error fetching mind map:", err))
                .finally(() => setLoading(false));
        }
    }, [propDocId]);

    // 1. Upload PDF
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        setLoading(true);
        try {
            // Upload
            const uploadRes = await axios.post('/api/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newDocId = uploadRes.data._id;
            setDocId(newDocId);
            setFileName(uploadRes.data.fileName);

            // Generate Mind Map (LLM-Free)
            const genRes = await axios.post(`/api/documents/mindmap/${newDocId}`, {
                processingType: 'mindmap'
            });

            if (genRes.data.success && genRes.data.mindMap) {
                const { nodes, edges } = genRes.data.mindMap;
                if (nodes && nodes.length > 0) {
                    setNodes(nodes);
                    setEdges(edges || []);
                } else {
                    alert('Could not generate a mind map structure from this PDF. Try adding nodes manually.');
                }
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Failed to process PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Add New Node
    const addNewNode = () => {
        const id = `manual_${Date.now()}`;
        const newNode = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: 'New Concept' },
            type: 'default',
            className: 'mindmap-node'
        };
        setNodes((nds) => nds.concat(newNode));
    };

    // 3. Save Changes
    const saveMindMap = async () => {
        if (!docId) return;
        try {
            await axios.put(`/api/documents/mindmap/${docId}`, {
                nodes,
                edges
            });
            alert('Mind map saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save changes.');
        }
    };

    // 4. Export PDF
    const exportPDF = async () => {
        if (!docId) return;
        try {
            // Save first to ensure PDF is up to date
            await axios.put(`/api/documents/mindmap/${docId}`, { nodes, edges });
            
            const response = await axios.post('/api/documents/report', {
                documentId: docId,
                reportType: 'mindmap'
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${fileName || 'mindmap'}-report.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export PDF.');
        }
    };

    return (
        <div className="mindmap-studio">
            {/* Sidebar */}
            <div className={`studio-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <Zap size={24} color="#14b8a6" />
                        {sidebarOpen && <span>MindFlow</span>}
                    </div>
                    <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {sidebarOpen && (
                    <div className="sidebar-content">
                        <div className="control-group">
                            <h3>Document</h3>
                            <div className="file-status">
                                <FileText size={16} />
                                <span>{fileName || 'No file selected'}</span>
                            </div>
                            <input 
                                type="file" 
                                accept=".pdf" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileUpload}
                            />
                            <button className="btn-primary" onClick={() => fileInputRef.current.click()}>
                                <Upload size={16} /> Upload PDF
                            </button>
                        </div>

                        <div className="control-group">
                            <h3>Actions</h3>
                            <button className="btn-secondary" onClick={addNewNode}>
                                <Plus size={16} /> Add Node
                            </button>
                            <button className="btn-secondary" onClick={saveMindMap} disabled={!docId}>
                                <Save size={16} /> Save Changes
                            </button>
                            <button className="btn-accent" onClick={exportPDF} disabled={!docId}>
                                <Download size={16} /> Export Report
                            </button>
                        </div>

                        <div className="control-group">
                            <h3>Stats</h3>
                            <div className="stat-row">
                                <span>Nodes</span>
                                <strong>{nodes.length}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Connections</span>
                                <strong>{edges.length}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Canvas */}
            <div className="studio-canvas">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls />
                        <MiniMap 
                            nodeStrokeColor={(n) => {
                                if (n.type === 'input') return '#0041d0';
                                if (n.type === 'output') return '#ff0072';
                                if (n.type === 'default') return '#1a192b';
                                return '#eee';
                            }}
                            nodeColor={(n) => {
                                if (n.type === 'selectorNode') return '#fff';
                                return '#fff';
                            }}
                            maskColor="rgba(241, 245, 249, 0.7)"
                        />
                        
                        {/* Floating Toolbar */}
                        <Panel position="top-center" className="floating-toolbar">
                            <button title="Layout" onClick={() => alert('Auto-layout coming soon!')}>
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
                    <div className="empty-state-overlay">
                        <div className="upload-card">
                            <div className="icon-circle">
                                <Upload size={40} color="#14b8a6" />
                            </div>
                            <h2>Start Mapping</h2>
                            <p>Upload a PDF to generate an instant mind map</p>
                            <button className="btn-large" onClick={() => fileInputRef.current.click()}>
                                Select PDF File
                            </button>
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