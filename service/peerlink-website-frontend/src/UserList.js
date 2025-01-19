import React, { useState, useEffect } from "react";
import axios from "axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  // Fetch users from the backend
  useEffect(() => {
    axios
      .get("http://peerlink.ceng.metu.edu.tr:8083/users/")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setError("Failed to load users.");
      });
  }, []);

  return (
    <div>
      <h1>User List</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {users.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
};

export default UserList;
