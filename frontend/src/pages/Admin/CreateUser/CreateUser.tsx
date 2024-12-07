import React, { useState } from "react";
import "./CreateUser.css";

interface Permissions {
  upload: boolean;
  download: boolean;
  search: boolean;
}

const CreateUserPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>({
    upload: false,
    download: false,
    search: false,
  });
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [userGroup, setUserGroup] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPermissions({ ...permissions, [name]: checked });
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "create-group") {
      setIsCreatingGroup(true);
      setUserGroup("");
    } else {
      setUserGroup(value);
      setIsCreatingGroup(false);
    }
  };

  const handleCreateGroup = () => {
    if (newGroupName && !userGroups.includes(newGroupName)) {
      setUserGroups([...userGroups, newGroupName]);
      setUserGroup(newGroupName);
      setNewGroupName("");
      setIsCreatingGroup(false);
    } else {
      alert("Group name is either empty or already exists.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGroup) {
      alert("Please assign the user to a group or create a new group.");
      return;
    }
    const newUser = {
      username,
      password,
      permissions,
      userGroup,
    };
    try {
    console.log(permissions)
    const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password,
        permissions: permissions
    })
  })

  const result = await response.json();
  if (response.status !== 200) {
    throw new Error(result.message);
  }
    console.log("User Created:", newUser);
    alert("User created successfully!");
    setUsername("");
    setPassword("");
    setPermissions({
      upload: false,
      download: false,
      search: false,
    });
      setUserGroup("");

  }
  catch (error) {
    console.error("Error creating user:", error);
    alert("Error creating user. Please try again.");
  }
}

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
                name="edit"
                checked={permissions.edit}
                onChange={handlePermissionChange}
                aria-label="Toggle Edit Permission"
              />{" "}
              Edit
            </label>
            <label>
              <input
                type="checkbox"
                name="search"
                checked={permissions.search}
                onChange={handlePermissionChange}
                aria-label="Toggle Search Permission"
              />{" "}
              Search
            </label>
          </div>
          <div className="createuser-group">
            <h3 className="createuser-title">Assign User to a Group</h3>
            {isCreatingGroup ? (
              <div className="create-group-container">
                <input
                  type="text"
                  className="createuser-input"
                  placeholder="Enter new group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  aria-label="Enter new group name"
                />
                <button
                  type="button"
                  className="createuser-button"
                  onClick={handleCreateGroup}
                >
                  Create Group
                </button>
              </div>
            ) : (
              <select
                value={userGroup}
                onChange={handleGroupChange}
                className="createuser-dropdown"
                aria-label="Select User Group"
                required
              >
                <option value="" disabled>
                  Select a group
                </option>
                {userGroups.map((group, index) => (
                  <option key={index} value={group}>
                    {group}
                  </option>
                ))}
                <option value="create-group">Create New Group</option>
              </select>
            )}
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
