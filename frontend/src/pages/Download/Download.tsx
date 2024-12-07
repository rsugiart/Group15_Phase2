import React, { useState } from 'react';
import './Download.css';

const Download: React.FC = () => {
  const [packageName, setPackageName] = useState<string>('');
  const [packageVersion, setPackageVersion] = useState<string>('');

  const handleDownload = () => {
    if (!packageName || !packageVersion) {
      alert('Please provide both a package name and version.');
      return;
    }

    // Construct the download URL using the name and version
    const filePath = `/packages/${packageName}-${packageVersion}.zip`; // Update this path according to your backend file structure

    // Simulate file download
    const link = document.createElement('a');
    link.href = filePath;
    link.download = `${packageName}-${packageVersion}.zip`;
    link.click();
  };

  return (
    <main className="download-container">
      <h1 className="download-title" tabIndex={0}>Download a Package</h1>
      <section className="download-input-container">
        <label htmlFor="package-name" className="file-input-label">
          Package Name:
        </label>
        <input
          id="package-name"
          className="text-input"
          type="text"
          placeholder="Enter package name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          aria-label="Enter the name of the package"
          required
        />

        <label htmlFor="package-version" className="file-input-label">
          Package Version:
        </label>
        <input
          id="package-version"
          className="text-input"
          type="text"
          placeholder="Enter version (e.g., 1.0.0)"
          value={packageVersion}
          onChange={(e) => setPackageVersion(e.target.value)}
          aria-label="Enter the version of the package"
          required
        />

        <button
          className="download-button"
          onClick={handleDownload}
          aria-label="Download the specified package" 
        >
          Download Package
        </button>
      </section>
    </main>
  );
};

export default Download;
