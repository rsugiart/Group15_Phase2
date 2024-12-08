import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  setPermissions: (permissions: string[]) => void;
  setIsAdmin: (isAdmin: string[]) => void;
  setToken: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({setPermissions,setIsAdmin,setToken}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();
  localStorage.setItem('permissions', '[]');
  localStorage.setItem('isAdmin', '[]');

  const handleLogin = async () => {
    // Implement your login logic here
    try {
      const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/login`, {
        method: "PUT",
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
      // localStorage.setItem('accessToken', result.accessToken.split(' ')[1])
      // localStorage.setItem('permissions',result.permissions)
      if (result.isAdmin) {
        setIsAdmin(["Admin"])
        localStorage.setItem('isAdmin', JSON.stringify(result.isAdmin));
      }
      setPermissions(result.permissions)
      // console.log(result.permissions)
      // setPermissions(result.permissions)
      // console.log('Login successful')
      // console.log(result.accessToken)
      setToken(result.accessToken.split(' ')[1])
      localStorage.setItem('numApiCalls', '0');
      localStorage.setItem('accessToken', result.accessToken.split(' ')[1]);
      localStorage.setItem('permissions', JSON.stringify(result.permissions));
      // console.log("Yellow:")
      navigate('/')
     }
     else {
      setMessage(String(result))
     }

  }
  catch (error) {
      setMessage(String(error))
      console.error("Error logging in:", error);
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
        Administrator? <a href="/upload" className="login-link">Admin Login</a>
      </p>
      {message && <h3> {message}</h3>}
    </div>
  );
};

export default LoginPage;
