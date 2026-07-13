import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const AIAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const stages = [
    "Uploading image...",
    "Detecting road boundaries...",
    "Analyzing surface damage...",
    "Calculating depth and area...",
    "Generating work order..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        const newProgress = prev + 1;
        setStage(Math.floor(newProgress / 20));
        return newProgress;
      });
    }, 50); // 5 seconds total

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
      
      {!isComplete ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full text-center"
        >
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-govBlue border-t-transparent"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-govBlue/10 rounded-full">
              <BrainCircuit className="w-10 h-10 sm:w-12 sm:h-12 text-govBlue" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">AI is analyzing your report</h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 h-6">{stages[Math.min(stage, 4)]}</p>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5 mb-2 overflow-hidden">
            <motion.div 
              className="bg-govBlue h-2 sm:h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
              layout
            />
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
        >
          <div className="bg-govBlue px-4 py-6 sm:px-6 sm:py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-3 sm:mb-4" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Analysis Complete</h2>
            <p className="text-govBlue-light text-xs sm:text-sm">Work Order #PWD-2023-8942 Created</p>
          </div>

          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">AI Findings</h3>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-xl border border-red-100 dark:border-red-800">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium mb-1">Severity</p>
                <p className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-500 flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> High
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Confidence</p>
                <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-500">96.4%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Est. Dimensions</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">45cm x 60cm</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Est. Depth</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">12cm</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border border-gray-200 dark:border-gray-600">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Automated Actions</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" /> Assigned to Road Repair Team B</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" /> Estimated material cost: ₹12,500</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" /> Scheduled within 48 hours</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/timeline')}
              className="w-full flex items-center justify-center gap-2 bg-govBlue hover:bg-govBlue-dark text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              View Work Order Timeline <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIAnalysis;
