import React, { useState, useEffect } from 'react';

type FileMagnetData = {
  [filename: string]: string; // Each key (filename) maps to a string (magnetLink)
};

const FilenameMagnetDisplay = () => {
  const [fileMagnetData, setFileMagnetData] = useState<FileMagnetData>({});

  useEffect(() => {
    const handleFilenameMagnetUpdate = (event: any, data: any) => {
      setFileMagnetData(data);
    };
    window.electron.onFilename2MagnetUpdate(handleFilenameMagnetUpdate);
  }, []);

  return (
    <div className="input-box">
      <h2>Files and Magnet Links</h2>
      <div id="dynamicBox" className="dynamic-box">
        {Object.keys(fileMagnetData).length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Magnet Link</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(fileMagnetData).map(([filename, magnetLink], index) => (
                  <tr key={index}>
                    <td>{filename}</td>
                    <td>{magnetLink}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <p>No files to display</p>
        )}
      </div>
    </div>
  );
};

export default FilenameMagnetDisplay;
