import React from 'react';
import './App.css';
import PackageUpload from './components/upload-button';
import SearchButton from './components/search-button';

function App() {
  return (
    <div className="App">
      <PackageUpload />
      <SearchButton />
    </div>
  );
}

export default App;
