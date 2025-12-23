import React from 'react';
import { ExternalLink, Maximize2, FileWarning } from 'lucide-react';

const PDFViewer = ({ fileUrl }) => {
  if (!fileUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10">
        <FileWarning size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">No document selected for viewing.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Viewer Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          Original Document
        </h3>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={18} />
        </a>
      </div>

      {/* PDF Content Area */}
      <div className="flex-grow bg-slate-100 relative">
        {/* Security Note: 
          We use an iframe to render the PDF. In a production environment, 
          ensure the 'fileUrl' is served from a secure bucket (S3/Cloudinary) 
          with appropriate CORS headers. 
        */}
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full border-none"
          title="PDF Content"
        />
      </div>

      {/* Security Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase text-center tracking-widest">
          Secure Sandbox Viewer
        </p>
      </div>
    </div>
  );
};

export default PDFViewer;