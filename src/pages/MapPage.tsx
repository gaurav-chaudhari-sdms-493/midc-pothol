import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, User, Wrench } from 'lucide-react';
import { potholes } from '../data/potholes';

type Role = 'user' | 'engineer';

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'Reported':
      return 'red';
    case 'In Progress':
      return 'yellow';
    case 'Fixed':
      return 'green';
    default:
      return 'blue';
  }
};

const MapPage = () => {
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 18.5204, lng: 73.8567 });
  const [mapZoom, setMapZoom] = useState(12);
  const [userRole, setUserRole] = useState<Role>('user');
  const [activePothole, setActivePothole] = useState<(typeof potholes)[0] | null>(null);
  const navigate = useNavigate();

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
          setSelectedLocation(null);
          setMapCenter(userLocation);
          setMapZoom(16);
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

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (userRole === 'user' && e.latLng) {
      const clickedPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setSelectedLocation(clickedPos);
      setUserPosition(null);
      setActivePothole(null);
    } else {
      setActivePothole(null);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      alert(`Location confirmed at: \nLat: ${selectedLocation.lat}, \nLng: ${selectedLocation.lng}`);
    }
  };

  const handlePotholeClick = (pothole: (typeof potholes)[0]) => {
    setActivePothole(pothole);
  };

  const handleViewMore = (potholeId: string) => {
    navigate(`/reports/${potholeId}`);
  };

  useEffect(() => {
    handleLocateUser();
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setUserRole('user')}
          className={`p-2 rounded-full shadow-lg ${userRole === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          aria-label="User View"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          onClick={() => setUserRole('engineer')}
          className={`p-2 rounded-full shadow-lg ${userRole === 'engineer' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          aria-label="Engineer View"
        >
          <Wrench className="w-5 h-5" />
        </button>
      </div>

      <GoogleMap
        center={mapCenter}
        zoom={mapZoom}
        mapContainerClassName="h-full w-full z-0"
        options={{ streetViewControl: false, mapTypeControl: false, mapId: "3e3c61cb78957e7b8a0752ee", mapTypeId: "roadmap" }}
        onClick={handleMapClick}
      >
        {userRole === 'user' && userPosition && <MarkerF position={userPosition} />}
        {userRole === 'user' && selectedLocation && <MarkerF position={selectedLocation} />}

        {userRole === 'engineer' &&
          potholes.map((pothole) => (
            <MarkerF
              key={pothole.id}
              position={{ lat: pothole.lat, lng: pothole.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getMarkerColor(pothole.status),
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 8,
              }}
              onClick={() => handlePotholeClick(pothole)}
            />
          ))}

        {activePothole && (
          <InfoWindowF
            position={{ lat: activePothole.lat, lng: activePothole.lng }}
            onCloseClick={() => setActivePothole(null)}
          >
            <div className="p-2">
              <img src={activePothole.imageUrl} alt="Pothole" className="w-48 h-auto rounded-lg mb-2" />
              <h3 className="font-bold">{activePothole.address}</h3>
              <p>Status: {activePothole.status}</p>
              <p>Severity: {activePothole.severity}</p>
              <button
                onClick={() => handleViewMore(activePothole.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded mt-2 text-sm"
              >
                View More
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <button
        onClick={handleLocateUser}
        className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
        aria-label="Locate me"
      >
        <LocateFixed className="w-5 h-5" />
      </button>

      {userRole === 'user' && selectedLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white p-4 rounded-lg shadow-lg">
          <button
            onClick={handleConfirmLocation}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPage;