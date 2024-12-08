import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <img src="../registry_logo.png" alt="Registry Logo" className="registry-logo" />
      <h1 className="home-title">Welcome to Group 15's Internal Package Registry</h1>
      <p className="home-text">
        Explore our features and enjoy a seamless experience with our platform.
      </p>
      {/* <button className="nav-button" onClick={() => window.location.href = '/get-started'}>
          Get Started
        </button> */}
      <button className="nav-button" onClick={() => window.location.href = '/login'}>
          Login
        </button>
    </div>
  );
}

export default Home;
