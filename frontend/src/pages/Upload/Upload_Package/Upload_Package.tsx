import React from 'react';
import './Upload_Package.css';

function Upload_Package() {
    return (
        <div className="upload_package-container">
          <h1 className="upload_package-title">Upload a Package</h1>
          <p className="upload_package-text">
            Choose from the options below to explore our platform features:
          </p>
          <div className="button-container">
            <button
              className="nav-button"
              onClick={() => window.location.href = '/upload/upload-package/upload-by-url'}
            >
              Upload by URL
            </button>
            <button
              className="nav-button"
              onClick={() => window.location.href = '/upload/upload-package/upload-by-file'}
            >
              Upload by File
            </button>
          </div>
        </div>
      );
    }

export default Upload_Package;
