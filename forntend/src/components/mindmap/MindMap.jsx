import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Customizing the look of the map
const nodeStyles = {
  background: '#fff',
  color: '#1e293b',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '10px',
  fontSize: '12px',
  fontWeight: 'bold',
  width: 150,
  textAlign: 'center',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const MindMap = ({ data }) => {
  // data expected: { nodes: [], edges: [], confidence?, metadata? } 
  // Can be from LLM-free service or Gemini
  const [nodes, setNodes, onNodesChange] = useNodesState(data?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data?.edges || []);
  
  const isLLMFree = data?.metadata?.method === 'LLM-Free Statistical NLP';
  const confidence = data?.confidence;

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Normalize nodes: handle both { label } and { data: { label } } formats
  const normalizedNodes = nodes.map(node => {
    const normalized = { ...node, style: nodeStyles };
    // If node has label but no data.label, move it to data.label for React Flow v12
    if (node.label && !node.data) {
      normalized.data = { label: node.label };
      delete normalized.label;
    }
    // If node has data.label, ensure it exists
    if (!normalized.data || !normalized.data.label) {
      normalized.data = { label: node.label || node.id || 'Node' };
    }
    return normalized;
  });

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <ReactFlow
        nodes={normalizedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background color="#cbd5e1" gap={20} />
      </ReactFlow>
      
      {/* Visual Overlay for User Guidance */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Interactive Concept Graph
        </div>
        {isLLMFree && (
          <div className="bg-green-50/90 backdrop-blur-md p-2 rounded-lg border border-green-200 text-[9px] font-bold text-green-700">
            🧠 LLM-Free • Offline
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