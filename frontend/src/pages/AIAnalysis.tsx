import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AIAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisResult } = location.state || {};

  if (!analysisResult) {
    return <p>No analysis data available. Please submit a report first.</p>;
  }

  const {
    total_potholes_detected,
    original_image_url,
    annotated_image_url,
    pothole_details,
  } = analysisResult;

  const handleReport = (pothole) => {
    navigate('/report-details', {
      state: {
        potholeToReport: pothole,
        analysisResult: {
            original_image_url: original_image_url
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pothole Analysis Results</h1>
      <p className="mb-4">
        <strong>Total Potholes Detected:</strong> {total_potholes_detected}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Original Image</h2>
          <img
            src={original_image_url}
            alt="Original"
            className="rounded-lg shadow-md"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Annotated Image</h2>
          <img
            src={annotated_image_url}
            alt="Annotated"
            className="rounded-lg shadow-md"
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Pothole Details</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="w-full bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Confidence</th>
              <th className="py-3 px-6 text-left">Est. Distance (m)</th>
              <th className="py-3 px-6 text-left">Est. Width (cm)</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {pothole_details.map((pothole) => (
              <tr key={pothole.pothole_id_in_image} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{pothole.pothole_id_in_image}</td>
                <td className="py-3 px-6 text-left">{(pothole.confidence * 100).toFixed(2)}%</td>
                <td className="py-3 px-6 text-left">{pothole.estimated_distance_m ?? 'N/A'}</td>
                <td className="py-3 px-6 text-left">{pothole.estimated_width_cm ?? 'N/A'}</td>
                <td className="py-3 px-6 text-center">
                  <button
                    onClick={() => handleReport(pothole)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AIAnalysis;