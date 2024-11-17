import React from 'react';
import './Search.css';
import SearchButton from '../../components/search-button';

const SearchPage: React.FC = () => {
  return (
    <div className="search-container">
      <h1 className="search-title">Search for Packages</h1>
      <div className="search-input-container">
        <SearchButton />
      </div>
    </div>
  );
};

export default SearchPage;
