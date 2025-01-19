import React, { useState } from "react";
import axios from "axios";

const TorrentSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = () => {
    setError(""); // Reset errors
    setResults([]); // Reset results
    if (!searchQuery.trim()) {
      setError("Please enter a search term.");
      return;
    }

    axios
      .get("http://peerlink.ceng.metu.edu.tr:8083/search/", {
        params: { query: searchQuery },
      })
      .then((response) => {
        setResults(response.data);
      })
      .catch((error) => {
        console.error("Error searching torrents:", error);
        setError("Failed to fetch results.");
      });
  };

  return (
    <div>
      <h1>Search Torrents</h1>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Enter search term..."
      />
      <button onClick={handleSearch}>Search</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {results.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploader</th>
              <th>Upload Date</th>
              <th>Magnet Link</th>
            </tr>
          </thead>
          <tbody>
            {results.map((torrent, index) => (
              <tr key={index}>
                <td>{torrent.fileName || "N/A"}</td>
                <td>{torrent.uploader || "N/A"}</td>
                <td>{torrent.upload_date || "N/A"}</td>
                <td>
                  <a
                    href={torrent.magnet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Magnet Link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && <p>No results found.</p>
      )}
    </div>
  );
};

export default TorrentSearch;
