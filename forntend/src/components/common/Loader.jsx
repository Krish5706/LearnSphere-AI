import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ fullPage = false, message = "Securing connection..." }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {loaderContent}
    </div>
  );
};

export default Loader;