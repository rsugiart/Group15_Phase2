import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Implement your registration logic here
    try {
      console.log(password)
      const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(password)
    })

    const result = await response.json();
     if (response.status === 200) {
      navigate('/login')
     }
     else {
      setMessage(result.message)
     }

  }
  catch (error) {
      setMessage(String(error))
  }
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
