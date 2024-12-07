import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import PackageUpload from './components/upload-button';
import SearchButton from './components/search-button';
import Navbar from './components/navbar';
import Home from './pages/Home/Home';
import Download from './pages/Download/Download';
import Upload from './pages/Upload/Upload';
import Search from './pages/Search/Search';
import Get_Started from './pages/Get_Started/Get_Started';
import Login from './pages/Login/Login';
import AdminPage from './pages/Admin/Admin';
import CreateUserPage from './pages/Admin/CreateUser/CreateUser';
import ModifyUsersPage from './pages/Admin/ModifyUserPermissions/ModifyUserPermissions';

function App() {
  const [token, setToken] = useState<string>('');
  
  return (
    <Router>
      <Navbar />
      <div className="App">
      {/* <PackageUpload />
      <SearchButton /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<Get_Started />} />
        <Route path="/search" element={<Search token={token} />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/download" element={<Download />} />
        <Route path="/login" element={<Login token={token} setToken = {setToken} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/create-user" element={<CreateUserPage />} />
        <Route path="/admin/modify-user-permissions" element={<ModifyUsersPage />} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;


