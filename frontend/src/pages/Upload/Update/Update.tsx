import React from 'react';
import './Update.css';

/**
 * Update component serves as the landing page for updating packages.
 * Provides navigation options to update a package either by URL or by uploading a file.
 *
 * @returns {JSX.Element} - The rendered Update component.
 */
function Update() {
    return (
        <div className="update_package-container">
          <h1 className="update_package-title">Update a Package</h1>
          <p className="update_package-text">
            Choose from the options below to explore our platform features:
          </p>
          <div className="button-container">
            <button
              className="nav-button"
              onClick={() => window.location.href = '/upload/update/update-by-url'}
            >
              Update by URL
            </button>
            <button
              className="nav-button"
              onClick={() => window.location.href = '/upload/update/update-by-file'}
            >
              Update by File
            </button>
          </div>
        </div>
      );
    }
export default Update;
