const MapPage = () => {
  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm m-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Interactive Map</h1>
        <p className="text-sm sm:text-base text-gray-500">Leaflet integration placeholder. This will display markers for reported and active pothole repairs.</p>
        <p className="text-xs sm:text-sm mt-2 sm:mt-4 text-govBlue">Mock data pins will be rendered here.</p>
      </div>
    </div>
  );
};

export default MapPage;