import React from 'react';
import { FileText, MoreVertical, Calendar, Eye, Trash2 } from 'lucide-react';
import { formatDate, formatBytes } from '../../utils/helpers';

const PDFList = ({ documents, onView, onDelete }) => {
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Added</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{doc.fileName}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">PDF Document</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar size={14} />
                  {formatDate(doc.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {formatBytes(doc.fileSize || 0)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onView(doc._id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View Analysis"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(doc._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {documents.length === 0 && (
        <div className="py-20 text-center">
          <FileText size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm font-medium">No documents in your secure vault yet.</p>
        </div>
      )}
    </div>
  );
};

export default PDFList;