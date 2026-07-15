import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, User, Wrench, Filter, Loader, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_BASE_URL } from '../config';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type Role = 'user' | 'engineer';
type ReportStatus = 'Reported' | 'In Progress' | 'Fixed' | 'All';

const MapPage = () => {
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([18.5204, 73.8567]);
  const [userRole, setUserRole] = useState<Role>('engineer');
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [filter, setFilter] = useState<ReportStatus>('All');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setReports(data.filter(report => report.lat && report.lng));
      } catch (e) {
        console.error('Error fetching reports:', e);
        setError('Could not load report data. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleReportClick = (report: any) => {
    setActiveReport(report);
  };

  const handleViewMore = (reportId: string) => {
    navigate(`/reports/${reportId}`);
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
      case 'Reported': return redIcon;
      case 'In Progress': return yellowIcon;
      case 'Fixed': return greenIcon;
      default: return new L.Icon.Default();
    }
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'All') return true;
    return report.status === filter;
  });

  return (
    <div className="relative h-full w-full">
      {userRole === 'engineer' && (
        <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-lg flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as ReportStatus)} className="bg-white border border-gray-300 rounded-md text-sm">
              <option value="All">All</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Fixed">Fixed</option>
            </select>
          </div>
          {loading && <Loader className="w-5 h-5 animate-spin text-gray-500" />}
          {error && <AlertTriangle className="w-5 h-5 text-red-500" title={error} />}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={12} className="h-full w-full z-0" zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {userRole === 'engineer' &&
          filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={getIcon(report.status)}
              eventHandlers={{
                click: () => {
                  handleReportClick(report);
                },
              }}
            >
              {activeReport && activeReport.id === report.id && (
                <Popup>
                  <div className="p-2">
                    <img src={`${activeReport.original_image_url}?t=${new Date().getTime()}`} alt="Pothole" className="w-48 h-auto rounded-lg mb-2" />
                    <h3 className="font-bold">{activeReport.address}</h3>
                    <p>Status: {activeReport.status}</p>
                    <p>Severity: {activeReport.severity}</p>
                    <button
                      onClick={() => handleViewMore(activeReport.id)}
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