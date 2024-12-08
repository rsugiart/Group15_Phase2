import React, { useState } from 'react';
import './Upload.css';

export interface UploadPageProps {
  token: string;
}

const Upload: React.FC<UploadPageProps> = ({token}) => {
  const [packageUrl, setPackageUrl] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [patch, setPatch] = useState('');
  const [packageName, setPackageName] = useState('');
  const [message, setMessage] = useState<string>('');

  const upload = async () => {

    if (!packageUrl) {
        setMessage('No Input');
        return;
    }
    try {
        console.log("token:", token)
        console.log("package name:", packageName)
        var numApiCalls = parseInt(localStorage.getItem('numApiCalls') || '0');
        console.log("numApiCalls:", numApiCalls)
        numApiCalls = numApiCalls + 1;
        const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/package`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Authorization": "bearer " + token
          },
          body: JSON.stringify({Name: packageName,URL:packageUrl})
        });
        const result = await response.json();
        console.log(result)
        localStorage.setItem('numApiCalls', String(numApiCalls));

        
    }
    catch (error) {
        console.log(error)
        setMessage(String(error))
    }

}


  return (
    <div className="upload-container">
      <h1 className="upload-title">Upload a Package</h1>
      <div className="upload-input-options">
        {/* URL Input */}
        <div className="file-input-container">
          <label className="file-input-label" htmlFor="url-upload">
            Package URL:
          </label>
          <input
            type="text"
            id="url-upload"
            className="upload-input"
            placeholder="Enter package URL"
            onChange={(e) => setPackageUrl(e.target.value)}
            aria-label="Enter a URL to upload the package from"
          />
        </div>

        {/* File Input */}
        <div className="file-input-container">
          <label className="file-input-label" htmlFor="file-upload">
            Choose a File:
          </label>
          <input
            type="file"
            id="file-upload"
            className="file-input"
            accept=".zip,.tar.gz,.tgz"
            aria-label="Choose a file to upload, accepts .zip, .tar.gz, or .tgz"
          />
        </div>
      </div>

      <div className="file-input-container">
        <label className="file-input-label" htmlFor="package-name">
          Package Name:
        </label>
        <input
          type="text"
          id="package-name"
          className="upload-input"
          placeholder="Enter package name"
          onChange={(e) => setPackageName(e.target.value)}
          aria-label="Enter the name of the package you are uploading"
        />
      </div>

      <div className="file-input-container">
        <label className="file-input-label">Version:</label>
        <div className="version-input-group">
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            aria-label="Enter the major version number"
          />
          <span className="version-separator">.</span>
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={minor}
            onChange={(e) => setMinor(e.target.value)}
            aria-label="Enter the minor version number"
          />
          <span className="version-separator">.</span>
          <input
            type="text"
            className="version-input"
            placeholder="0"
            value={patch}
            onChange={(e) => setPatch(e.target.value)}
            aria-label="Enter the patch version number"
          />
        </div>
      </div>

      <button className="upload-button" aria-label="Click to upload the package" onClick={upload}>
        Upload
      </button>
    </div>
  );
};

export default Upload;
