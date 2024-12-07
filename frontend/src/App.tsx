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
import ProtectedRoute from './components/useAuth';

function App() {
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState<string[]>(['Admin']);
  const [permissions, setPermissions] = useState<string[]>(['upload', 'download', 'search']);
  setToken(localStorage.getItem('accessToken') || '');
  setPermissions(localStorage.getItem('permissions')?.split(',') || []);
  
  return (
    <Router>
      <Navbar />
      <div className="App">
      {/* <PackageUpload />
      <SearchButton /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<Get_Started />} />
        <Route path="/login" element={<Login setPermissions={setPermissions} setIsAdmin={setIsAdmin}/>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute permissions={isAdmin} permission='Admin'>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute permissions={permissions} permission='upload'>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute permissions={permissions} permission='download'>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/download"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/create-user" element={<CreateUserPage />} />
        <Route path="/admin/modify-user-permissions" element={<ModifyUsersPage />} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;



