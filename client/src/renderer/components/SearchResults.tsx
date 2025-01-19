import React from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SearchResults() {
  const location = useLocation();
  const { results } = location.state || {}; // Access the results from state

  function handleFileDownload(magnetLink: string) {
    window.electron.leechFile(magnetLink);
    toast('The download has started. Please wait...');
  }

  return (
    <div className="overflow-auto mt-2">
      <ToastContainer />
      {results.length > 0 ? (
        results.map((file, index) => (
          <div
            key={index}
            className="bg-white d-flex align-items-center justify-content-between p-3 mb-4 rounded"
          >
            <p>
              <strong>{file.filename}</strong>
            </p>
            <button
              className="btn btn-success"
              onClick={() => handleFileDownload(file.magnet_link)}
            >
              Download
            </button>
          </div>
        ))
      ) : (
        <p>No results found. Please try another search.</p>
      )}
    </div>
  );
}

export default SearchResults;
