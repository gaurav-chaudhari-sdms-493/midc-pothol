import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AnalysisLoadingPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const storedImagePreview = sessionStorage.getItem('imagePreview');
    const storedFormData = sessionStorage.getItem('formData');
    setImagePreview(storedImagePreview);

    if (!storedFormData || !storedImagePreview) {
      navigate('/report', { state: { error: 'An unexpected error occurred. Please try submitting again.' } });
      return;
    }

    const formData = new FormData();
    const parsedFormData: [string, string][] = JSON.parse(storedFormData);
    
    const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
              bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], {type:mime});
    };

    // Reconstruct FormData
    let hasImage = false;
    parsedFormData.forEach(([key, value]) => {
        if (key === 'image') {
            // The 'image' key is just a placeholder. We'll add the blob below.
            hasImage = true;
        } else {
            formData.append(key, value);
        }
    });

    if (hasImage) {
        const imageBlob = dataURLtoBlob(storedImagePreview);
        formData.append('image', imageBlob, 'pothole.jpg');
    }


    const performAnalysis = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
          throw new Error(errorData.detail || 'Analysis failed');
        }

        const result = await response.json();
        sessionStorage.setItem('analysisResult', JSON.stringify(result));
        navigate('/ai-analysis');
      } catch (err) {
        setError((err as Error).message);
      } finally {
        // Clean up session storage
        sessionStorage.removeItem('imagePreview');
        sessionStorage.removeItem('formData');
      }
    };

    performAnalysis();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Analysis Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/report')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 overflow-hidden">
        {imagePreview && (
            <div className="relative w-64 h-64">
                <img src={imagePreview} alt="Analyzing" className="rounded-full w-full h-full object-cover shadow-lg"/>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
        )}
        <h2 className="text-2xl font-semibold mt-8 text-gray-800">Analyzing Image...</h2>
        <p className="text-gray-500 mt-2">Our AI is detecting potholes. Please wait a moment.</p>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-8">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
    </div>
  );
};

export default AnalysisLoadingPage;