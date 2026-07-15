import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Activity, Clock, CheckCircle2, AlertTriangle, Users, Loader, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { useNotification } from '../components/notifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    inProgress: 0,
    critical: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const reports = await response.json();
        
        const pending = reports.filter(r => r.status === 'Analyzed').length;
        const approved = reports.filter(r => r.status === 'Reported').length;
        const inProgress = reports.filter(r => r.status === 'In Progress').length;
        const critical = reports.filter(r => r.severity === 'High').length;

        setStats({ pending, approved, inProgress, critical });
        setRecentReports(reports.slice(0, 5));
        if (!hasFetchedData.current) {
          addNotification('Dashboard data loaded successfully!', 'success');
          hasFetchedData.current = true;
        }

      } catch (e) {
        addNotification((e as Error).message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [addNotification]);

  const handleRowClick = (reportId: number) => {
    navigate(`/reports/${reportId}`);
  };

  const statCards = [
    { label: 'Pending Review', value: stats.pending, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Critical Severity', value: stats.critical, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  if (loading) {
    return <div className="p-4 text-center"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Overview Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Live metrics and work order statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs sm:text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm self-start sm:self-auto">
            Last updated: Just now
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">
          {statCards.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
            >
              <div className={`p-2 rounded-lg ${stat.bg} self-start mb-2`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Reports vs Repairs (Monthly)</h2>
            <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              <div className="text-center text-gray-400 p-4">
                <BarChart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chart rendering placeholder</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-govBlue" /> Team Workload
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {[
                { team: 'Team A (North)', jobs: 18, color: 'bg-blue-500', total: 20 },
                { team: 'Team B (South)', jobs: 24, color: 'bg-red-500', total: 30 },
                { team: 'Team C (East)', jobs: 12, color: 'bg-yellow-500', total: 15 },
                { team: 'Team D (West)', jobs: 5, color: 'bg-green-500', total: 20 },
              ].map((team) => (
                <div key={team.team}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{team.team}</span>
                    <span className="text-gray-500">{team.jobs} active jobs</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                    <div className={`${team.color} h-1.5 sm:h-2 rounded-full`} style={{ width: `${(team.jobs / team.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto hidden sm:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentReports.map((report) => (
                  <tr key={report.id} onClick={() => handleRowClick(report.id)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-govBlue">#{report.id}</td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-300">{report.address}</td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">{report.reportedBy}</td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{report.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3 p-4">
            {recentReports.map((report) => (
              <div key={report.id} onClick={() => handleRowClick(report.id)} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-govBlue">#{report.id}</span>
                  <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-800">{report.status}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"><MapPin size={14} /> {report.address}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2"><Calendar size={12} /> {new Date(report.reportedDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;