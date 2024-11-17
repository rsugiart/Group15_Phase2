import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import PackageUpload from './components/upload-button';
import SearchButton from './components/search-button';
import Navbar from './components/navbar';
import Home from './pages/Home/Home';
// import Download from './pages/Download/Download';
import Upload from './pages/Upload/Upload';
import Search from './pages/Search/Search';
import Get_Started from './pages/Get_Started/Get_Started';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
      {/* <PackageUpload />
      <SearchButton /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<Get_Started />} />
        <Route path="/search" element={<Search />} />
        <Route path="/upload" element={<Upload />} />
        {/* <Route path="/download" element={<Download />} /> */}
        {/* <Route path="/rate" element={<Rate />} /> */}
      </Routes>
      </div>
    </Router>
  );
}

export default App;
