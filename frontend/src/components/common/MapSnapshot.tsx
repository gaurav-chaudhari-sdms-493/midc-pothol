import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapSnapshotProps {
  lat: number;
  lng: number;
}

const MapSnapshot = ({ lat, lng }: MapSnapshotProps) => {
  if (!lat || !lng) {
    return null;
  }

  const position: L.LatLngExpression = [lat, lng];

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="w-full h-full rounded-md border border-gray-500" style={{ height: '100%', minHeight: '100px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position} />
    </MapContainer>
  );
};

export default MapSnapshot;
