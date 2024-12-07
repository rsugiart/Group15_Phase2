import React, { useEffect, useState } from "react";
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
  const [users, setUsers] = useState<User[]>([]);
  const [oldUsers, setOldUsers] = useState<User[]>([]);
  useEffect(() => {
    // Fetch user data when the component mounts
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/users"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
    
        // Transform API response into a User array
        const userList: User[] = data.users.map((user: any, index: number) => ({
          id: index + 1, // Incremental ID
          username: user.username,
          permissions: {
            upload: Array.isArray(user.permissions) && user.permissions.includes("upload"),
            download: Array.isArray(user.permissions) && user.permissions.includes("download"),
            rate: Array.isArray(user.permissions) && user.permissions.includes("rate"),
            search: Array.isArray(user.permissions) && user.permissions.includes("search"),
          },
        }));
    
        setUsers(userList);
        setOldUsers(userList);
      } catch (err: any) {
        console.error("Error fetching users:", err.message);
      }
    };

    fetchUsers();
  }, []);

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

  const handleSave = async (userId: number) => {
    const user = users.find((user) => user.id === userId);
    const oldUser = oldUsers.find((user) => user.id === userId);

    if (user && oldUser) {
      const hasChanged =
      JSON.stringify(user.permissions) !== JSON.stringify(oldUser.permissions);
      if (hasChanged) {
          setOldUsers((prevOldUsers) =>
          prevOldUsers.map((oldUser) =>
            oldUser.id === userId ? { ...oldUser, permissions: { ...user.permissions } } : oldUser
          )
        );
        const updatedPermissions = Object.keys(user.permissions).filter(
          (key) => user.permissions[key as keyof User["permissions"]]
        );
        console.log(updatedPermissions)
        try {
        const response = await fetch(
          `https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/users/${user.username}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: user.username,
            permissions: updatedPermissions
          })
        }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        alert("User permissions updated successfully.");
        const data = await response.json();
    
      
      } catch (err: any) {
        console.error("Error fetching users:", err.message);
      }
        // Update user permissions
      }
      console.log(hasChanged)
      


    }
  };

  const handleDelete = async (userId: number) => {
    const user = users.find((user) => user.id === userId);
    try {
      const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/users/${user?.username}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      }
      )
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      alert("User deleted successfully.");

    }
    catch (err: any) {
      console.error("Error deleting user", err.message);
    }
    
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
                    aria-label="Toggle Upload Permission"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.download}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "download", e.target.checked)
                    }
                    aria-label="Toggle Download Permission"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.rate}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "rate", e.target.checked)
                    }
                    aria-label="Toggle Rate Permission"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.permissions.search}
                    onChange={(e) =>
                      handlePermissionChange(user.id, "search", e.target.checked)
                    }
                    aria-label="Toggle Search Permission"
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
