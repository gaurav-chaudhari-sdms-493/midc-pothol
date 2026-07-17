import React from 'react';

const AnalysisInProgress = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4"></div>
        <h2 className="text-2xl font-semibold mb-2">AI Analysis in Progress</h2>
        <p className="text-gray-600">
          Please wait while we analyze the image. This may take a few moments.
        </p>
      </div>
    </div>
  );
};

export default AnalysisInProgress;