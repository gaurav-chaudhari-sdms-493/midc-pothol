import { Menu, Bell, User, Sun, Moon, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const [darkMode, setDarkMode] = useState(false);
  const { role, toggleRole } = useAuthStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-govBlue rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">PWD Pothole AI</span>
        </Link>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {/* Role Switcher Toggle (For PoC only) */}
        <button
          onClick={toggleRole}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          title="Toggle view between Citizen and Engineer"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span className="hidden sm:inline">View: </span>
          <span className="capitalize text-govBlue dark:text-govBlue-light">{role}</span>
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        
        <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-status-danger"></span>
        </Link>
        
        <Link to="/profile" className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div className="h-8 w-8 rounded-full bg-govBlue-light flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
