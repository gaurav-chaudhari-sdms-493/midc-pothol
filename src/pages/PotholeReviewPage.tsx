import { useParams } from 'react-router-dom';
import { potholes } from '../data/potholes';

const PotholeReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const pothole = potholes.find((p) => p.id === parseInt(id || ''));

  if (!pothole) {
    return <div>Pothole not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pothole Details</h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p><strong>ID:</strong> {pothole.id}</p>
        <p><strong>Address:</strong> {pothole.address}</p>
        <p><strong>Status:</strong> {pothole.status}</p>
        <p><strong>Coordinates:</strong> Lat: {pothole.lat}, Lng: {pothole.lng}</p>
      </div>
    </div>
  );
};

export default PotholeReviewPage;