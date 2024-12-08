import React, { useState } from 'react';
import './Upload.css';

const Upload: React.FC = () => {
  const [url, setUrl] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [patch, setPatch] = useState('');

  return (
    <div className="upload-container">
      <h1 className="upload-title">Upload a Package</h1>
      <div className="upload-input-options">
        {/* URL Input */}
        <div className="file-input-container">
          <label className="file-input-label" htmlFor="url-upload">
            Package URL:
          </label>
          <input
            type="text"
            id="url-upload"
            className="upload-input"
            placeholder="Enter package URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Enter a URL to upload the package from"
          />
        </div>

        {/* File Input */}
        <div className="file-input-container">
          <label className="file-input-label" htmlFor="file-upload">
            Choose a File:
          </label>
          <input
            type="file"
            id="file-upload"
            className="file-input"
            accept=".zip,.tar.gz,.tgz"
            aria-label="Choose a file to upload, accepts .zip, .tar.gz, or .tgz"
          />
        </div>
      </div>

      <div className="file-input-container">
        <label className="file-input-label" htmlFor="package-name">
          Package Name:
        </label>
        <input
          type="text"
          id="package-name"
          className="upload-input"
          placeholder="Enter package name"
          aria-label="Enter the name of the package you are uploading"
        />
      </div>

      <div className="file-input-container">
        <label className="file-input-label">Version:</label>
        <div className="version-input-group">
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            aria-label="Enter the major version number"
          />
          <span className="version-separator">.</span>
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={minor}
            onChange={(e) => setMinor(e.target.value)}
            aria-label="Enter the minor version number"
          />
          <span className="version-separator">.</span>
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={patch}
            onChange={(e) => setPatch(e.target.value)}
            aria-label="Enter the patch version number"
          />
        </div>
      </div>

      <button className="upload-button" aria-label="Click to upload the package">
        Upload
      </button>
    </div>
  );
};

export default Upload;
