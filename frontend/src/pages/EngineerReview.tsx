import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, CheckCircle2, XCircle, Search, Filter, Calendar, FileCheck2, ArrowLeft, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
};

const EngineerReview = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports?status=Analyzed`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch reports for review');
        }
        const data = await response.json();
        setReports(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleUpdateStatus = async (id: number, status: 'In Progress' | 'Fixed' | 'Rejected') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }
      
      setReports(reports.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return <div className="p-4 text-center"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col h-full lg:h-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Pending Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review AI-assessed pothole reports and generate work orders.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        <div className={`lg:col-span-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-14rem)] lg:h-[70vh] ${selectedReport ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 shrink-0">
             <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:ring-1 focus:ring-govBlue text-gray-900 dark:text-white"
                />
             </div>
             <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
               <Filter className="h-4 w-4" />
             </button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            <AnimatePresence>
              {reports.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-sm">No pending reports to review.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedReport?.id === report.id 
                        ? 'border-govBlue bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-govBlue/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">Report #{report.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{report.address}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3 mr-1 shrink-0" /> {new Date(report.reportedDate).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={`lg:col-span-2 h-[calc(100vh-14rem)] lg:h-[70vh] ${!selectedReport ? 'hidden lg:block' : 'block'}`}>
          {selectedReport ? (
            <motion.div 
              key={selectedReport.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedReport(null)} 
                    className="p-1.5 -ml-2 rounded-full lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Report {selectedReport.id}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">By {selectedReport.reportedBy} on {new Date(selectedReport.reportedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`hidden sm:inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getSeverityColor(selectedReport.severity)}`}>
                  {selectedReport.severity} Severity
                </span>
              </div>

              <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Citizen Photo</p>
                    <img src={selectedReport.original_image_url} alt="Pothole" className="rounded-lg shadow-md w-full" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Annotated</p>
                    <img src={selectedReport.annotated_image_url} alt="Annotated" className="rounded-lg shadow-md w-full" />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> AI Pre-Assessment
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase font-semibold">Potholes</p>
                      <p className="font-medium text-blue-900 dark:text-blue-200">{selectedReport.pothole_details.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase font-semibold">Est. Size</p>
                      <p className="font-medium text-blue-900 dark:text-blue-200">{selectedReport.estSize}</p>
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Engineer Review Notes (Optional)
                   </label>
                   <textarea 
                     rows={2} 
                     className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-govBlue focus:ring-govBlue sm:text-sm p-3 border"
                     placeholder="Specific instructions for repair team..."
                   ></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3 sm:gap-4 shrink-0">
                <button 
                  onClick={() => handleUpdateStatus(selectedReport.id, 'Rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-sm sm:text-base font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors border border-transparent"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedReport.id, 'In Progress')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-sm sm:text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Approve
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center hidden lg:flex">
              <FileCheck2 className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Select a Report</h3>
              <p className="text-sm">Choose a pending report from the list on the left to review its details and generate a work order.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EngineerReview;