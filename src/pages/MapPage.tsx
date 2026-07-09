import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { useState, useMemo } from 'react';
import { LocateFixed } from 'lucide-react';

const MapPage = () => {
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 18.5204, lng: 73.8567 }); // Default to Pune
  const [mapZoom, setMapZoom] = useState(13);

  const libraries = useMemo(() => ['marker'], []);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries as any,
  });

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation = { lat: latitude, lng: longitude };
          setUserPosition(userLocation);
          setMapCenter(userLocation);
          setMapZoom(16); // Zoom in on user's location
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert("Could not retrieve your location. Please ensure you have granted permission.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <h1 className="text-xl font-bold">Error loading Google Maps</h1>
          <p>Please ensure your API key is correct and has the necessary permissions.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p>Loading Map...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        center={mapCenter}
        zoom={mapZoom}
        mapContainerClassName="h-full w-full z-0"
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {userPosition && <MarkerF position={userPosition} />}
      </GoogleMap>
      <button
        onClick={handleLocateUser}
        className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Locate me"
      >
        <LocateFixed className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MapPage;