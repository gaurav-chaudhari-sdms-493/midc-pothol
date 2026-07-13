import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const PotholeReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pothole, setPothole] = useState(null);

  useEffect(() => {
    const fetchPothole = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/potholes/${id}`);
        const data = await response.json();
        setPothole(data);
      } catch (error) {
        console.error('Error fetching pothole:', error);
      }
    };

    if (id) {
      fetchPothole();
    }
  }, [id]);

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