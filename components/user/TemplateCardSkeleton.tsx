import React from 'react';

const TemplateCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[20px] shadow-md overflow-hidden flex flex-col">
      <div className="relative aspect-[4/5] bg-gray-200 animate-pulse">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-[shimmer_1.5s_infinite]"></div>
      </div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2 animate-pulse"></div>
        <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded-md w-1/3 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded-md w-1/4 animate-pulse"></div>
        </div>
        <div className="w-full mt-3 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default TemplateCardSkeleton;
