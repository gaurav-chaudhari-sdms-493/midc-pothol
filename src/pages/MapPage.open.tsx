import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, User, Wrench, Filter } from 'lucide-react';
import { potholes } from '../data/potholes';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type Role = 'user' | 'engineer';
type PotholeStatus = 'Reported' | 'In Progress' | 'Fixed' | 'All';

const LocationMarker = ({ setUserPosition, setMapCenter, setMapZoom }: any) => {
  const map = useMap();

  const handleLocateUser = () => {
    map.locate().on("locationfound", function (e) {
      setUserPosition(e.latlng);
      map.flyTo(e.latlng, 16);
      setMapCenter(e.latlng);
      setMapZoom(16);
    });
  };

  useEffect(() => {
    handleLocateUser();
  }, [map]);

  return null;
}

const MapEvents = ({ setSelectedLocation, setUserPosition, setActivePothole, userRole }: any) => {
  useMapEvents({
    click(e) {
      if (userRole === 'user') {
        setSelectedLocation(e.latlng);
        setUserPosition(null);
        setActivePothole(null);
      } else {
        setActivePothole(null);
      }
    },
  });
  return null;
}

const MapPage = () => {
  const [userPosition, setUserPosition] = useState<L.LatLng | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState(12);
  const [userRole, setUserRole] = useState<Role>('user');
  const [activePothole, setActivePothole] = useState<(typeof potholes)[0] | null>(null);
  const [filter, setFilter] = useState<PotholeStatus>('All');
  const navigate = useNavigate();

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

  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const getIcon = (status: string) => {
    switch (status) {
      case 'Reported':
        return redIcon;
      case 'In Progress':
        return yellowIcon;
      case 'Fixed':
        return greenIcon;
      default:
        return new L.Icon.Default();
    }
  }

  const filteredPotholes = potholes.filter(pothole => {
    if (filter === 'All') return true;
    return pothole.status === filter;
  });

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
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

      {userRole === 'engineer' && (
        <div className="absolute top-4 left-28 z-[1000] bg-white p-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as PotholeStatus)} className="bg-white border border-gray-300 rounded-md">
              <option value="All">All</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Fixed">Fixed</option>
            </select>
          </div>
        </div>
      )}

      <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker setUserPosition={setUserPosition} setMapCenter={setMapCenter} setMapZoom={setMapZoom} />
        <MapEvents setSelectedLocation={setSelectedLocation} setUserPosition={setUserPosition} setActivePothole={setActivePothole} userRole={userRole} />

        {userRole === 'user' && userPosition && <Marker position={userPosition} />}
        {userRole === 'user' && selectedLocation && <Marker position={selectedLocation} />}

        {userRole === 'engineer' &&
          filteredPotholes.map((pothole) => (
            <Marker
              key={pothole.id}
              position={[pothole.lat, pothole.lng]}
              icon={getIcon(pothole.status)}
              eventHandlers={{
                click: () => {
                  handlePotholeClick(pothole);
                },
              }}
            >
              {activePothole && activePothole.id === pothole.id && (
                <Popup>
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
                </Popup>
              )}
            </Marker>
          ))}
      </MapContainer>

      <button
        onClick={() => {
          const map = useMap();
          map.locate().on("locationfound", function (e) {
            setUserPosition(e.latlng);
            map.flyTo(e.latlng, 16);
            setMapCenter(e.latlng);
            setMapZoom(16);
          });
        }}
        className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
        aria-label="Locate me"
      >
        <LocateFixed className="w-5 h-5" />
      </button>

      {userRole === 'user' && selectedLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white p-4 rounded-lg shadow-lg">
          <button
            onClick={handleConfirmLocation}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Confirm Location
          </button>
        </div>
      )}

      {userRole === 'engineer' && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Legend</h3>
          <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" alt="Reported" className="w-4 h-6" />
            <span>Reported</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png" alt="In Progress" className="w-4 h-6" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Fixed" className="w-4 h-6" />
            <span>Fixed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;