import React from 'react';
import './Search.css';
import SearchButton from '../../components/search-button';

export interface SearchPageProps {
  token: string;
}

const SearchPage: React.FC<SearchPageProps> = ({token}) => {
  return (
    <div className="search-container">
      <h1 className="search-title">Search for Packages</h1>
      <div className="search-input-container">
        <SearchButton token={token} />
      </div>
    </div>
  );
};

export default SearchPage;
