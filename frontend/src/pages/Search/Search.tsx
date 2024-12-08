import React from 'react';
import './Search.css';

function Search() {
  return (
    <div className="search-container">
      <h1 className="search-title">Welcome to the Search Landing Page</h1>
      <p className="search-text">
        Choose from the options below to explore our platform features.
      </p>
      <div className="button-container">
        <button className="nav-button" onClick={() => window.location.href = '/search/get-rating'}>
          Get Rating
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/search/version-search'}>
          Search by Version
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/search/regex-search'}>
          Search by Regex
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/search/view-registry'}>
          View Registry
        </button>
      </div>
    </div>
  );
}

export default Search;
