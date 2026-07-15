const AboutPage = () => {
  return (
    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow max-w-3xl mx-auto prose dark:prose-invert h-full overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-govBlue">About This Project</h1>
      <p className="text-base sm:text-lg">This is a Proof of Concept (PoC) Progressive Web App for the PWD Pothole-to-Work-Order Agent system.</p>
      
      <h2 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-2">Features Demonstrated</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
        <li>Citizen reporting interface with mock location and image handling.</li>
        <li>Mocked AI workflow for damage analysis and severity estimation.</li>
        <li>Automated work order creation timeline.</li>
        <li>Dashboards for monitoring reports and team allocation.</li>
        <li>Responsive, mobile-first design leveraging Tailwind CSS and Framer Motion.</li>
      </ul>
      
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-400 m-0"><strong>Note:</strong> This is a frontend-only prototype utilizing mock JSON data. No actual backend, database, or live AI models are connected.</p>
      </div>
    </div>
  );
};

export default AboutPage;