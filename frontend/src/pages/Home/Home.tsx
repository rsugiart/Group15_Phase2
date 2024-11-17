import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to Group 15's Internal Package Registry</h1>
      <p className="home-text">
        Explore our features and enjoy a seamless experience with our platform.
      </p>
      <button className="nav-button" onClick={() => window.location.href = '/get-started'}>
          Get Started
        </button>
    </div>
  );
}

export default Home;
