import React, { useState } from 'react';

const FileUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleOpenFileDialog = async () => {
    if (window.electron) {
      const filePath = await window.electron.openFileDialog();
      if (filePath) {
        setSelectedFiles([filePath]);
      }
    } else {
      console.error('Electron API is not available');
    }
  };

  // Handle drag-and-drop functionality
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (window.electron) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const filePaths = Array.from(files).map(file => file.path);
        filePaths.forEach(filePath => window.electron.dragAndDropFileDialog(filePath));
        setSelectedFiles(filePaths);
      }
    } else {
      console.error('Electron API is not available');
    }
  };

  return (
    <div className="input-box">
      <h3>Upload File</h3>

      {/* Drag-and-drop zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag and drop a file here, or click below to upload</p>
        )}
      </div>

      {/* File input button */}
      <button className="btn btn-success" onClick={handleOpenFileDialog}>
        Upload File
      </button>

      {/* Selected file display */}
      {selectedFiles.length > 0 && (
        <div>
          <h4>Selected Files:</h4>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Add some styles */}
      <style>{`
        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 5px;
          padding: 20px;
          text-align: center;
          margin-bottom: 20px;
          transition: background-color 0.2s ease;
        }
        .drop-zone.dragging {
          background-color: #f0f8ff;
          border-color: #007bff;
        }
        .btn {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );

};

export default FileUpload;
