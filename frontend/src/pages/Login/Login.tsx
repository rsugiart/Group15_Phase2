import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  token: string;
  setToken: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({token:string, setToken}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Implement your login logic here
    try {
      const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
      })
    })


    const result = await response.json();
     if (response.status === 200) {
      setToken(result.accessToken)
      navigate('/')
     }
     else {
      setMessage(result.message)
     }

  }
  catch (error) {
      setMessage(String(error))
  }

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
        aria-label="Enter your Username"
      />
      <input
        type="password"
        className="login-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Enter your Password"
      />
      <button className="login-button" onClick={handleLogin}>
        Login
      </button>
      <p className="login-text">
        Administrator? <a href="/admin" className="login-link">Admin Login</a>
      </p>
      {message && <h3> {message}</h3>}
    </div>
  );
};

export default LoginPage;
