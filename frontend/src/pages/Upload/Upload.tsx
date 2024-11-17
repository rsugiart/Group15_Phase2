import React, { useState } from 'react';
import './Upload.css';
import PackageUpload from '../../components/upload-button';

const Upload: React.FC = () => {
  return (
    <div className="upload-container">
      <h1 className="upload-title">Upload a Package</h1>
      <div className="upload-input-container">
        <PackageUpload />
      </div>
    </div>
  );
};

export default Upload;
