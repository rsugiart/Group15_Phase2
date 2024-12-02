import React, { useState } from 'react';
import './Login.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    // Implement your login logic here
    console.log('Logging in with', { username, password });
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Welcome Back</h1>
      <input
        type="text"
        className="login-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="login-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="login-button" onClick={handleLogin}>
        Login
      </button>
      <p className="login-text">
        Don't have an account? <a href="/register" className="login-link">Sign Up</a>
      </p>
      <p className="login-text">
        Administrator? <a href="/admin" className="login-link">Admin Login</a>
      </p>
    </div>
  );
};

export default LoginPage;
