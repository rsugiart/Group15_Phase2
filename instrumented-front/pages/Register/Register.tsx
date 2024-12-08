import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const navigate = useNavigate();

  const handleRegister = () => {
    // Implement your registration logic here
    console.log('Registering user:', { name, username, password });
    // Navigate to login page after successful registration
    navigate('/login');
  };

  return (
    <div className="register-container">
      <h1 className="register-title">Create Your Account</h1>
      <input
        type="text"
        className="register-input"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        className="register-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="register-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="register-button" onClick={handleRegister}>
        Register
      </button>
      <p className="register-text">
        Already have an account? <a href="/login" className="register-link">Login</a>
      </p>
    </div>
  );
};

export default RegisterPage;
