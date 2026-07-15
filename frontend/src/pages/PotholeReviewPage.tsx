import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ReportReviewPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!response.ok) {
          throw new Error('Report not found');
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        setError((error as Error).message);
        console.error('Error fetching report:', error);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!report) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Report Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Pothole Image</h2>
            <img src={report.original_image_url} alt="Pothole" className="rounded-lg shadow-md w-full" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">ID</h3>
              <p>{report.id}</p>
            </div>
            <div>
              <h3 className="font-semibold">Address</h3>
              <p>{report.address}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                report.status === 'Reported' ? 'bg-yellow-100 text-yellow-800' :
                report.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {report.status}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Coordinates</h3>
              <p>Lat: {report.lat}, Lng: {report.lng}</p>
            </div>
            <div>
              <h3 className="font-semibold">Severity</h3>
              <p>{report.severity}</p>
            </div>
            <div>
              <h3 className="font-semibold">Estimated Size</h3>
              <p>{report.estSize}</p>
            </div>
            <div>
              <h3 className="font-semibold">Reported By</h3>
              <p>{report.reportedBy}</p>
            </div>
            <div>
              <h3 className="font-semibold">Reported Date</h3>
              <p>{new Date(report.reportedDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewPage;