import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ReportDetailsPage = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    lat: '',
    lng: '',
    address: '',
    severity: 'Medium',
    reportedBy: 'Anonymous',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        const data = await response.json();
        setReport(data);
        setFormData({
          lat: data.lat?.toString() || '',
          lng: data.lng?.toString() || '',
          address: data.address || '',
          severity: data.severity || 'Medium',
          reportedBy: data.reportedBy || 'Anonymous',
        });
      } catch (error) {
        setSubmitError((error as Error).message);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const geocodeCoordinates = async (lat: number, lng: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data?.display_name || `Approx. ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    } catch (error) {
      console.error('Failed to fetch geocoding data:', error);
      return `Approx. ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await geocodeCoordinates(latitude, longitude);
          setFormData((prev) => ({
            ...prev,
            lat: latitude.toString(),
            lng: longitude.toString(),
            address: address,
          }));
          setIsLocating(false);
        },
        (error) => {
          setLocationError('Could not retrieve location. Please enter manually.');
          setIsLocating(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const { pothole_details } = report;
    const estimatedSizes = pothole_details.map(p => p.estimated_width_cm);
    const estSize = estimatedSizes.length > 1 
      ? `${Math.min(...estimatedSizes).toFixed(2)} - ${Math.max(...estimatedSizes).toFixed(2)} cm`
      : `${estimatedSizes[0].toFixed(2)} cm`;

    const reportData = {
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      address: formData.address,
      severity: formData.severity,
      reportedBy: formData.reportedBy,
      estSize: estSize,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'PUT',
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

  if (!report) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Report Pothole Details</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium">Address</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="lat" className="block text-sm font-medium">Latitude</label>
            <input type="text" name="lat" id="lat" value={formData.lat} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium">Longitude</label>
            <input type="text" name="lng" id="lng" value={formData.lng} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
          </div>
        </div>
        
        {locationError && <p className="text-red-500 text-sm">{locationError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>

        {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
        
        <div className="pt-4">
          <button type="submit" disabled={isSubmitting || isLocating} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportDetailsPage;