import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, User, AlertTriangle, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportDetails = () => {
  const { id } = useParams();
  const reportId = id || 'PWD-2023-8942';

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/reports" className="p-2 -ml-2 sm:ml-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Report {reportId}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Submitted on Oct 25, 2023</p>
          </div>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-auto">
          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] sm:text-sm font-medium">Assigned</span>
          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[10px] sm:text-sm font-medium">High Severity</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 overflow-y-auto">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Photo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="h-40 sm:h-64 bg-gray-200 dark:bg-gray-700 relative">
              {/* Placeholder for actual image */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-sm sm:text-lg">[Pothole Image Placeholder]</span>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center text-[10px] sm:text-sm">
              <span className="text-gray-500">Photo taken: Oct 25, 10:42 AM</span>
              <span className="text-govBlue font-medium cursor-pointer hover:underline">View Original</span>
            </div>
          </motion.div>

          {/* AI Analysis Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6"
          >
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-accent-orange" /> AI Damage Assessment
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Est. Width</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900 dark:text-white">45 cm</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Est. Length</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900 dark:text-white">60 cm</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Est. Depth</p>
                <p className="text-xs sm:text-base font-semibold text-gray-900 dark:text-white">12 cm</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">AI Confidence</p>
                <p className="text-xs sm:text-base font-semibold text-green-600 dark:text-green-400">96.4%</p>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6"
          >
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Work Order Timeline</h2>
            
            <div className="relative pl-6 sm:pl-8 space-y-6 sm:space-y-8 before:absolute before:inset-0 before:ml-8 sm:before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
              
              <div className="relative">
                <div className="absolute left-[-29px] sm:left-[-33px] bg-white dark:bg-gray-800 rounded-full border-4 border-gray-200 dark:border-gray-700 w-4 h-4"></div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Oct 25, 2:30 PM</p>
                <p className="text-xs sm:text-base font-medium text-gray-900 dark:text-white">Assigned to Team B</p>
                <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Work order generated and assigned to Road Repair Team B.</p>
              </div>
              
              <div className="relative">
                <div className="absolute left-[-29px] sm:left-[-33px] bg-govBlue rounded-full border-4 border-blue-100 dark:border-blue-900 w-4 h-4 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"></div>
                <p className="text-[10px] sm:text-sm text-govBlue font-medium mb-0.5 sm:mb-1">Oct 25, 10:45 AM</p>
                <p className="text-xs sm:text-base font-medium text-gray-900 dark:text-white">AI Analysis Complete</p>
                <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Severity assessed as High. Automated approval granted.</p>
              </div>

              <div className="relative">
                <div className="absolute left-[-29px] sm:left-[-33px] bg-green-500 rounded-full border-4 border-green-100 dark:border-green-900 w-4 h-4"></div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Oct 25, 10:42 AM</p>
                <p className="text-xs sm:text-base font-medium text-gray-900 dark:text-white">Report Submitted</p>
                <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Citizen successfully submitted the report via PWA.</p>
              </div>

            </div>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Location Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="h-24 sm:h-40 bg-gray-200 dark:bg-gray-700 relative">
              {/* Map Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-xs sm:text-sm">[Map Placeholder]</span>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-govBlue" /> Location Details
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">MG Road, near Metro Station</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Ward: 112 (Shivajinagar)</p>
              <p className="text-[10px] sm:text-xs text-gray-500">12.9716° N, 77.5946° E</p>
            </div>
          </div>

          {/* Citizen Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-govBlue" /> Reporter Info
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-medium shrink-0 text-xs sm:text-base">JD</div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Citizen Reporter (Verified)</p>
              </div>
            </div>
          </div>

          {/* Work Order Brief */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-govBlue" /> Work Order Brief
            </h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Cost</span>
                <span className="font-medium text-gray-900 dark:text-white">₹ 12,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Materials</span>
                <span className="font-medium text-gray-900 dark:text-white">Asphalt, Gravel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Target ETA</span>
                <span className="font-medium text-gray-900 dark:text-white">48 Hours</span>
              </div>
            </div>
            <button className="w-full mt-3 sm:mt-4 py-1.5 sm:py-2 border border-govBlue text-govBlue rounded-lg text-xs sm:text-sm font-medium hover:bg-govBlue hover:text-white transition-colors flex items-center justify-center gap-1 sm:gap-2">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /> Download PDF Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportDetails;