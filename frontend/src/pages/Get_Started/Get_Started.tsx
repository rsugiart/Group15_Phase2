import React from 'react';
import './Get_Started.css';


/**
 * GetStarted component serves as a starting point for users to explore the platform's features.
 * Provides navigation buttons to access the Search, Upload, and Download pages.
 *
 * @returns {JSX.Element} - The rendered GetStarted component.
 */
function GetStarted() {
  return (
    <div className="get-started-container">
      <h1 className="get-started-title">Get Started with Group 15</h1>
      <p className="get-started-text">
        Choose from the options below to explore our platform features.
      </p>
      <div className="get-started-button-container">
        <button className="nav-button" onClick={() => window.location.href = '/search'}>
          Go to Search Page
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/upload'}>
          Go to Upload Page
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/download'}>
          Go to Download Page
        </button>
      </div>
    </div>
  );
}

export default GetStarted;
