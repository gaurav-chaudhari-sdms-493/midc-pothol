import { useParams } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { useMemo, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ReportDetailsPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [pothole, setPothole] = useState(null);

  const libraries = useMemo(() => ['marker'], []);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries as any,
  });

  useEffect(() => {
    const fetchPothole = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/potholes/${reportId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const data = await response.json();
        setPothole(data);
      } catch (error) {
        console.error('Error fetching pothole:', error);
      }
    };

    fetchPothole();
  }, [reportId]);

  if (!pothole) {
    return <div className="p-4 text-center text-red-500">Report not found</div>;
  }

  const mapCenter = { lat: pothole.lat, lng: pothole.lng };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold">Report {pothole.id}</h1>
          <p className="text-gray-600">By {pothole.reportedBy} on {pothole.reportedDate}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Severity & Photo</h2>
              <div className={`text-lg font-bold ${pothole.severity === 'Critical' ? 'text-red-600' : 'text-yellow-500'}`}>
                {pothole.severity} Severity
              </div>
              <img src={pothole.imageUrl} alt="Pothole" className="w-full h-auto rounded-lg mt-4 shadow-md" />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Location Map</h2>
              <div className="h-64 w-full rounded-lg overflow-hidden shadow-md">
                {isLoaded && (
                  <GoogleMap
                    center={mapCenter}
                    zoom={16}
                    mapContainerClassName="h-full w-full"
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <MarkerF position={mapCenter} />
                  </GoogleMap>
                )}
                {loadError && <div>Error loading map</div>}
                {!isLoaded && <div>Loading map...</div>}
              </div>
              <p className="text-center mt-2 text-gray-600">{pothole.address}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-100">
          <h2 className="text-xl font-semibold mb-4">AI Pre-Assessment (Confidence: 98%)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Est. Size</p>
              <p className="text-lg font-bold">{pothole.estSize}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Est. Depth</p>
              <p className="text-lg font-bold">{pothole.estDepth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fix Type</p>
              <p className="text-lg font-bold">{pothole.fixType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Est. Cost</p>
              <p className="text-lg font-bold">{pothole.estCost}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Engineer Review Notes (Optional)</h2>
          <textarea
            className="w-full p-2 border rounded-lg"
            placeholder="Specific instructions for repair team..."
            rows={4}
          ></textarea>
        </div>

        <div className="p-6 flex justify-end gap-4 bg-gray-50 rounded-b-lg">
          <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">
            Reject
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsPage;