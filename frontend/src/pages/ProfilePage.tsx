const ProfilePage = () => {
  return (
    <div className="p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow max-w-md mx-auto mt-4 sm:mt-10">
      <div className="text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-govBlue text-white rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto mb-3 sm:mb-4">
          JD
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">John Doe</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6">Citizen Reporter Level 3</p>
        
        <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Reports Submitted</p>
            <p className="text-lg sm:text-xl font-semibold mt-1">14</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Fixed Issues</p>
            <p className="text-lg sm:text-xl font-semibold text-green-500 mt-1">12</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;