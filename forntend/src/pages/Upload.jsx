import React, { useState } from 'react';
import { Upload as UploadIcon, File, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false);
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h2 className="text-3xl font-bold mb-6 dark:text-white">Upload Document</h2>
      <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center transition-colors ${file ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700'}`}>
        {!file ? (
          <>
            <UploadIcon size={48} className="text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">Drag and drop your PDF here</p>
            <input type="file" className="hidden" id="pdf-upload" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
            <label htmlFor="pdf-upload" className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg">Browse Files</label>
          </>
        ) : (
          <div className="w-full flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <File className="text-blue-600" />
              <span className="font-medium dark:text-white">{file.name}</span>
            </div>
            <button onClick={() => setFile(null)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
          </div>
        )}
      </div>
      
      {file && (
        <button 
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {isUploading ? "Analyzing with AI..." : "Process Document"}
        </button>
      )}
    </div>
  );
};

export default Upload;