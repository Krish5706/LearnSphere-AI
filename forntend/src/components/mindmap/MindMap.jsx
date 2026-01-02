import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { BrainCircuit } from 'lucide-react';
import '@xyflow/react/dist/style.css';

// Custom node component for better styling
const CustomNode = ({ data }) => {
  return (
    <div
      style={{
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
      }}
    >
      {data.label}
    </div>
  );
};

// Define node types
const nodeTypes = {
  default: CustomNode,
};

const MindMap = ({ data }) => {
  // data expected: { nodes: [], edges: [], confidence?, metadata? }
  // Can be from LLM-free service or Gemini

  // Enhanced preprocessing to ensure proper React Flow v12 structure
  const preprocessData = (rawData) => {
    const safeData = rawData || {};
    const rawNodes = Array.isArray(safeData.nodes) ? safeData.nodes : [];
    const rawEdges = Array.isArray(safeData.edges) ? safeData.edges : [];

    // Preprocess nodes to ensure React Flow v12 compatibility
    const processedNodes = rawNodes.map((node, index) => {
      // Ensure required properties exist
      const processedNode = {
        id: node.id || `node_${index}`,
        type: node.type || 'default',
        position: node.position || { x: index * 150, y: index * 100 },
        data: node.data || {},
        ...node // Allow overriding defaults
      };

      // Ensure data.label exists for display
      if (!processedNode.data.label) {
        processedNode.data.label = node.label || node.id || `Node ${index + 1}`;
      }

      // Ensure position is valid
      if (!processedNode.position || typeof processedNode.position.x !== 'number' || typeof processedNode.position.y !== 'number') {
        processedNode.position = { x: index * 150, y: index * 100 };
      }

      return processedNode;
    });

    // Preprocess edges to ensure proper structure
    const processedEdges = rawEdges.map((edge, index) => ({
      id: edge.id || `edge_${index}`,
      source: edge.source || edge.from,
      target: edge.target || edge.to,
      ...edge // Allow additional properties
    })).filter(edge => edge.source && edge.target); // Filter out invalid edges

    return {
      nodes: processedNodes,
      edges: processedEdges,
      metadata: safeData.metadata,
      confidence: safeData.confidence
    };
  };

  const processedData = preprocessData(data);
  const { nodes: safeNodes, edges: safeEdges } = processedData;

  const [nodes, setNodes, onNodesChange] = useNodesState(safeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(safeEdges);

  // Update nodes and edges when data prop changes
  useEffect(() => {
    const newProcessedData = preprocessData(data);
    setNodes(newProcessedData.nodes);
    setEdges(newProcessedData.edges);
  }, [data, setNodes, setEdges]);

  const isLLMFree = processedData?.metadata?.method === 'LLM-Free Statistical NLP';
  const confidence = processedData?.confidence;

  // Show loading state if no data
  if (safeNodes.length === 0) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BrainCircuit size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Mind Map Available</h3>
          <p className="text-slate-600 text-sm">Generate a mind map to visualize concepts and relationships.</p>
        </div>
      </div>
    );
  }

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-slate-50 relative" style={{ minHeight: '400px', minWidth: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background color="#cbd5e1" gap={20} />
      </ReactFlow>

      {/* Visual Overlay for User Guidance */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        {isLLMFree && (
          <div className="bg-green-50/90 backdrop-blur-md p-2 rounded-lg border border-green-200 text-[9px] font-bold text-green-700">
             LLM-Free • Offline
          </div>
        )}
        {confidence !== undefined && (
          <div className="bg-blue-50/90 backdrop-blur-md p-2 rounded-lg border border-blue-200 text-[9px] font-bold text-blue-700">
            Confidence: {confidence}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMap;