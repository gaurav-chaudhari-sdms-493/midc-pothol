import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Upload, X, Map, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportPothole = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('Location not set');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Automatically request location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, we would reverse geocode these coordinates
          setLocation(`${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location', error);
          let errorMessage = 'Could not detect location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please enable it in your browser settings or select manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'The request to get user location timed out.';
          }
          setLocation('Location not detected');
          setLocationError(errorMessage);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocation('Location not detected');
      setLocationError('Geolocation is not supported by this browser.');
      setIsLocating(false);
    }
  };

  const handleRetryLocation = async () => {
     // If the browser supports the Permissions API, we can check the status
     if (navigator.permissions && navigator.permissions.query) {
         try {
             const result = await navigator.permissions.query({ name: 'geolocation' });
             if (result.state === 'denied') {
                 // The browser itself won't prompt again if it's strictly 'denied'. 
                 // We must instruct the user to change their browser settings.
                 setLocationError('Permission is permanently denied in your browser settings. Please enable it in settings or use the Map to select manually.');
                 return;
             }
         } catch (e) {
             console.error("Permissions API error", e);
         }
     }
     
     // Attempt to get location again; this will prompt the user if the state is 'prompt'
     getLocation();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call and redirect to AI analysis
    setTimeout(() => {
      navigate('/ai-analysis');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">Report a Pothole</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600 dark:text-gray-400">Help us keep the roads safe by reporting damaged areas.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4 sm:space-y-8 bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto">
        
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pothole Photo <span className="text-status-danger">*</span>
          </label>
          <div 
            className={`mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${imagePreview ? 'border-govBlue bg-govBlue/5' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <div className="space-y-1 text-center w-full relative">
              {imagePreview ? (
                <div className="relative w-full h-40 sm:h-64">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  
                  {/* Camera Option */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-govBlue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6 text-govBlue" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Camera</span>
                    <input 
                      ref={cameraInputRef} 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="sr-only" 
                      onChange={handleImageChange}
                    />
                  </button>

                  <div className="hidden sm:block text-gray-400">or</div>

                  {/* File Picker Option */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-govBlue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-govBlue transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-govBlue transition-colors">Gallery</span>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="sr-only" 
                      onChange={handleImageChange}
                    />
                  </button>
                  
                </div>
              )}
            </div>
          </div>
          {!imagePreview && <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2">PNG, JPG up to 10MB</p>}
        </div>

        {/* Location Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-govBlue mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Detected Location</p>
              {isLocating ? (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Fetching location...
                </div>
              ) : (
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">{location}</p>
              )}
              {locationError && (
                 <div className="flex items-start gap-1 text-[10px] sm:text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{locationError}</span>
                 </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
             <button
                type="button"
                onClick={handleRetryLocation}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
             <button
                type="button"
                onClick={() => navigate('/map')}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Map className="w-3 h-3" /> Map
              </button>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="landmark" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Nearby Landmark (Optional)
            </label>
            <input
              type="text"
              name="landmark"
              id="landmark"
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-govBlue focus:ring-govBlue text-xs sm:text-sm py-2 px-3 border"
              placeholder="e.g. Near Central Park entrance"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-govBlue focus:ring-govBlue text-xs sm:text-sm py-2 px-3 border"
              placeholder="Any other details that might help..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <button
            type="submit"
            disabled={!imagePreview || isSubmitting}
            className={`w-full flex justify-center items-center py-2.5 sm:py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white transition-all ${
              !imagePreview || isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-accent-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-orange'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportPothole;