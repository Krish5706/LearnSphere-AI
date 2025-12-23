import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Search, Share2 } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

const NodeTools = () => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    return (
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
            {/* Action Buttons */}
            <div className="bg-white/90 backdrop-blur shadow-xl border border-slate-200 rounded-2xl p-1.5 flex flex-col gap-1">
                <button 
                    onClick={() => zoomIn()}
                    className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
                    title="Zoom In"
                >
                    <ZoomIn size={20} />
                </button>
                <button 
                    onClick={() => zoomOut()}
                    className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
                    title="Zoom Out"
                >
                    <ZoomOut size={20} />
                </button>
                <button 
                    onClick={() => fitView({ duration: 800 })}
                    className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
                    title="Fit to Screen"
                >
                    <Maximize size={20} />
                </button>
            </div>

            {/* Security/Export Action */}
            <button className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center">
                <Share2 size={20} />
            </button>
        </div>
    );
};

export default NodeTools;