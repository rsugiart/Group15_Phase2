import React from 'react';
import './Admin.css';


/**
 * AdminPage component serves as the administrator's dashboard.
 * Provides navigation options to create users, modify user permissions, and reset the registry.
 *
 * @returns {JSX.Element} - The rendered AdminPage component.
 */
function AdminPage() {
  return (
    <div className="admin-container">
      <h1 className="admin-title">Welcome, Administrator</h1>
      <p className="admin-text">
        Choose from the options below to explore our platform features.
      </p>
      <div className="admin-button-container">
        <button className="nav-button" onClick={() => window.location.href = '/admin/create-user'}>
          Create a User
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/admin/modify-user-permissions'}>
          Modify User Permissions
        </button>
        <button className="nav-button" onClick={() => window.location.href = '/search'}>
          Reset Registry
        </button>
      </div>
    </div>
  );
}

export default AdminPage;
