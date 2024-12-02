import React, { useState } from "react";
import "./ModifyUserPermissions.css";

interface User {
  id: number;
  username: string;
  permissions: {
    upload: boolean;
    download: boolean;
    rate: boolean;
    search: boolean;
  };
}

const ModifyUsersPage: React.FC = () => {
  // Mock Data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "john_doe",
      permissions: {
        upload: true,
        download: false,
        rate: true,
        search: true,
      },
    },
    {
      id: 2,
      username: "jane_smith",
      permissions: {
        upload: false,
        download: true,
        rate: true,
        search: true,
      },
    },
    {
      id: 3,
      username: "admin_user",
      permissions: {
        upload: true,
        download: true,
        rate: true,
        search: true,
      },
    },
  ]);

  const handlePermissionChange = (
    userId: number,
    permission: keyof User["permissions"],
    value: boolean
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: { ...user.permissions, [permission]: value },
            }
          : user
      )
    );
  };

  const handleSave = (userId: number) => {
    const user = users.find((user) => user.id === userId);
    if (user) {
      console.log(`Saved user:`, user);
      alert(`Permissions updated for ${user.username}`);
    }
  };

  const handleDelete = (userId: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    alert("User deleted successfully.");
  };

  return (
    <div className="modify-users-page">
      <h1 className="modify-users-welcome">Welcome, Administrator</h1>
      <div className="users-container">
        <h2 className="modify-users-title">Modify Users</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Upload</th>
              <th>Download</th>
              <th>Rate</th>
              <th>Search</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.upload}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "upload", e.target.checked)
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.download}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "download", e.target.checked)
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.rate}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "rate", e.target.checked)
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.search}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "search", e.target.checked)
                    }
                  />
                </td>
                <td>
                  <button
                    className="save-button"
                    onClick={() => handleSave(user.id)}
                  >
                    Save
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModifyUsersPage;
