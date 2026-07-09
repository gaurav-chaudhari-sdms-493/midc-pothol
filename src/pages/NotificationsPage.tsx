const NotificationsPage = () => {
  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow max-w-2xl mx-auto h-full overflow-y-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Notifications</h1>
      <div className="space-y-3 sm:space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="p-3 sm:p-4 border-l-4 border-govBlue bg-gray-50 dark:bg-gray-700/50 rounded-r-lg">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Work Order Updated</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">Report PWD-2023-894{i} has been marked as In Progress.</p>
            <span className="text-[10px] sm:text-xs text-gray-400 mt-2 block">2 hours ago</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;