import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import PackageUpload from './components/upload-button';
import SearchButton from './components/search-button';
import Navbar from './components/navbar';
import Home from './pages/Home/Home';
import Download from './pages/Download/Download';
import Upload from './pages/Upload/Upload';
import Search from './pages/Search/Search';
import GetRatingPage from './pages/Search/Get_Rating/get_rating';
import ViewRegistryPage from './pages/Search/View Registry/view_registry';
import SearchByVersionPage from './pages/Search/Search by Version/version_search';
import SearchByRegexPage from './pages/Search/Search by Regex/regex_search';
import Get_Started from './pages/Get_Started/Get_Started';
import Login from './pages/Login/Login';
import AdminPage from './pages/Admin/Admin';
import CreateUserPage from './pages/Admin/CreateUser/CreateUser';
import ModifyUsersPage from './pages/Admin/ModifyUserPermissions/ModifyUserPermissions';
import ProtectedRoute from './components/useAuth';
import {jwtDecode} from 'jwt-decode';
import { checkTokenExpiration } from './utils/jwt_utils';


function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('accesstoken') || '');
  const [isAdmin, setIsAdmin] = useState<string[]>(JSON.parse(localStorage.getItem('isAdmin') || '[]'));
  const [permissions, setPermissions] = useState<string[]>(JSON.parse(localStorage.getItem('permissions') || '[]'));
  // const navigate = useNavigate();
  // console.log("Token:", token)
  useEffect(() => {
    const stored_token = localStorage.getItem('accessToken') || '';
    setToken(stored_token);
    const storedAdmin  = (JSON.parse(localStorage.getItem('isAdmin') || '[]'));
    setIsAdmin(isAdmin);
    const storedPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    setPermissions(storedPermissions);
    // console.log("Token:", token)
    // if (parseInt(localStorage.getItem('numApiCalls') || '0') >= 5) {
    //   console.log("You have exceeded the number of API calls")
    // }
    // if (token!== '' && !checkTokenExpiration(token)) {
    //   console.log("Hello")
    // }
  }, [token]); 
  
  return (
    <Router>
      <Navbar />
      <div className="App">
      {/* <PackageUpload />
      <SearchButton /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<Get_Started />} />
        <Route path="/login" element={<Login setPermissions={setPermissions} setIsAdmin={setIsAdmin} setToken={setToken}/>} />
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
              <Upload token={token}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <Search/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search/get-rating"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <GetRatingPage token={token}/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/search/view-registry"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <ViewRegistryPage token={token}/>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/search/version-search"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <SearchByVersionPage/>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/search/regex-search"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <SearchByRegexPage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/download"
          element={
            <ProtectedRoute permissions={permissions} permission='search'>
              <Download />
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



