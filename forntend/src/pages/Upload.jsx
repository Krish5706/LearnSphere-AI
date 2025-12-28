import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadPDFNew from '../components/pdf/UploadPDFNew';
import { Info, ShieldAlert } from 'lucide-react';

const Upload = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  // Security: Callback handled after backend validation and MongoDB storage
  const handleUploadSuccess = (data) => {
    if (data && data.docId) {
      navigate(`/document/${data.docId}`);
    } else {
      setError("Invalid response from server. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Upload Research Material
        </h1>
        <p className="text-slate-600 text-lg">
          Our AI will parse the content and structure it for your dashboard.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <ShieldAlert size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8">
          <UploadPDFNew />
        </div>
        
        {/* Security & Usage Notice */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-4">
          <div className="text-blue-600 mt-1">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Security Note</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Your files are processed using Google Gemini's secure API. Content is 
              stored in an encrypted MongoDB instance. We do not use your data 
              to train public models. Max file size: 10MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;