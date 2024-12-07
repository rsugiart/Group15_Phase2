import React, { useState } from "react";
import "./CreateUser.css";

interface Permissions {
  upload: boolean;
  download: boolean;
  edit: boolean;
}

const CreateUserPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>({
    upload: false,
    download: false,
    edit: false,
  });

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPermissions({ ...permissions, [name]: checked });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      username,
      password,
      permissions,
    };
    console.log("User Created:", newUser);
    alert("User created successfully!");
    setUsername("");
    setPassword("");
    setPermissions({
      upload: false,
      download: false,
      edit: false,
    });
  };

  return (
    <div className="createuser-page">
      <h1 className="createuser-welcome">Welcome, Administrator</h1>
      <div className="createuser-container">
        <h2 className="createuser-title">Create User</h2>
        <form onSubmit={handleSubmit} className="createuser-form">
          <input
            type="text"
            className="createuser-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="Enter the new User's Username"
          />
          <input
            type="password"
            className="createuser-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Enter the new User's Password"
          />
          <div className="createuser-permissions">
            <h3 className="createuser-title">Select User's Permissions</h3>
            <label>
              <input
                type="checkbox"
                name="upload"
                checked={permissions.upload}
                onChange={handlePermissionChange}
                aria-label="Toggle Upload Permission"
              />{" "}
              Upload
            </label>
            <label>
              <input
                type="checkbox"
                name="download"
                checked={permissions.download}
                onChange={handlePermissionChange}
                aria-label="Toggle Download Permission"
              />{" "}
              Download
            </label>
            <label>
              <input
                type="checkbox"
                name="rate"
                checked={permissions.edit}
                onChange={handlePermissionChange}
                aria-label="Toggle Rate Permission"
              />{" "}
              Rate 
            </label>
            <label>
              <input
                type="checkbox"
                name="search"
                checked={permissions.edit}
                onChange={handlePermissionChange}
                aria-label="Toggle Search Permission"
              />{" "}
              Search
            </label>
          </div>
          <button type="submit" className="createuser-button">
            Create User
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;
