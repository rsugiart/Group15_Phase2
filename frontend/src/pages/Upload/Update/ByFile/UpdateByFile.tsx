import React, { useState } from 'react';
import './UpdateByFile.css';

export interface UpdateByFilePageProps {
  token: string;
}

/**
 * UpdateByFile component allows users to update a package by uploading a file and providing package details.
 * Users can specify the package name, version, secret status, and upload supported file types.
 *
 * @param {string} token - Authentication token for making API requests.
 * @returns {JSX.Element} - The rendered UpdateByFile component.
 */
const UpdateByFile: React.FC<UpdateByFilePageProps> = ({token}) => {
  const [packageUrl, setPackageUrl] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [patch, setPatch] = useState('');
  const [packageName, setPackageName] = useState('');
  const [message, setMessage] = useState<string>('');
  const [isSecret, setIsSecret] = useState<boolean>(false);
  const [userGroup, setUserGroup] = useState<string>('default');

  /**
   * Handles the package update process by making an API request with the provided details.
   */
  const updateByFile = async () => {

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
    <div className="update-by-file-container">
      <h1 className="update-by-file-title">Update a Package by File</h1>

      <div className="update-by-file-input-options">
        <div className="file-input-container">
          <label className="file-input-label" htmlFor="file-update">
            Choose a File:
          </label>
          <input
            type="file"
            id="file-update"
            className="file-input"
            accept=".zip,.tar.gz,.tgz"
            aria-label="Choose a file to update, accepts .zip, .tar.gz, or .tgz"
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
          className="update-by-file-input"
          placeholder="Enter package name"
          onChange={(e) => setPackageName(e.target.value)}
          aria-label="Enter the name of the package you are updating"
        />
      </div>

      <div className="file-input-container">
        <label className="version-input-label">Version:</label>
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
      <div className="update-by-file-input-options">
        <div className="file-input-container">
          <label className="file-input-label">Mark as Secret:</label>
          <div className="secret-toggle-group">
            <button
              className={`toggle-button ${isSecret ? 'active' : ''}`}
              onClick={() => setIsSecret(true)}
              aria-label="Mark package as secret"
            >
              True
            </button>
            <button
              className={`toggle-button ${!isSecret ? 'active' : ''}`}
              onClick={() => setIsSecret(false)}
              aria-label="Do not mark package as secret"
            >
              False
            </button>
          </div>
        </div>
      </div>

      <button
        className="update-by-file-button"
        aria-label="Click to update the package"
        onClick={updateByFile}
      >
        Update!
      </button>
    </div>
  );
};

export default UpdateByFile;
