import React from 'react';
import './Upload.css';

/**
 * Upload component serves as the landing page for package upload and update functionalities.
 * Provides navigation buttons to upload a new package or update an existing package.
 *
 * @returns {JSX.Element} - The rendered Upload component.
 */
function Upload() {
  return (
    <div className="upload-container">
      <h1 className="upload-title">Welcome to the Upload Package and Update Package Landing Page</h1>
      <p className="upload-text">
        Choose from the options below to explore our platform features.:
      </p>
      <div className="button-container">
        <button
          className="nav-button"
          onClick={() => window.location.href = '/upload/upload-package'}
        >
          Upload
        </button>
        <button
          className="nav-button"
          onClick={() => window.location.href = '/upload/update'}
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default Upload;
