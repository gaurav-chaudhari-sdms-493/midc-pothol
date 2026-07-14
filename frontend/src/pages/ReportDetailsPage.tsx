import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ReportDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { potholeToReport, analysisResult } = location.state || {};

  const [formData, setFormData] = useState({
    lat: 18.5204,
    lng: 73.8567,
    address: 'FC Road, Pune',
    severity: 'Medium',
    reportedBy: 'Anonymous',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!potholeToReport || !analysisResult) {
      navigate('/report'); // Redirect if state is not passed
    }
  }, [potholeToReport, analysisResult, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const reportData = {
      id: `PWD-${new Date().toISOString()}`, // Generate unique ID
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      address: formData.address,
      status: 'Reported',
      reportedBy: formData.reportedBy,
      reportedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      severity: formData.severity,
      imageUrl: analysisResult.original_image_url,
      estSize: `${potholeToReport.estimated_width_cm} cm`,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/potholes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Failed to submit report');
      }

      navigate('/reports'); // Redirect to a confirmation or list page
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!potholeToReport) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Report Pothole Details</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium">Address</label>
          <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium">Latitude</label>
            <input type="number" name="lat" id="lat" value={formData.lat} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium">Longitude</label>
            <input type="number" name="lng" id="lng" value={formData.lng} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
          </div>
        </div>
        <div>
          <label htmlFor="severity" className="block text-sm font-medium">Severity</label>
          <select name="severity" id="severity" value={formData.severity} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div>
          <label htmlFor="reportedBy" className="block text-sm font-medium">Reported By</label>
          <input type="text" name="reportedBy" id="reportedBy" value={formData.reportedBy} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" />
        </div>
        {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportDetailsPage;