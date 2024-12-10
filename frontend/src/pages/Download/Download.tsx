import React, { useState } from 'react';
import './Download.css';

/**
 * Download component allows users to download a specific package by providing the package name and version.
 * Validates the input and triggers a simulated file download based on the provided details.
 *
 * @returns {JSX.Element} - The rendered Download component.
 */
const Download: React.FC = () => {
  const [packageName, setPackageName] = useState<string>('');
  const [versionParts, setVersionParts] = useState<{ major: string; minor: string; patch: string }>({
    major: '',
    minor: '',
    patch: '',
  });

  /**
   * Handles changes to the version input fields, ensuring only numeric values are entered.
   *
   * @param {'major' | 'minor' | 'patch'} part - The version part being updated (major, minor, or patch).
   * @param {string} value - The new value for the version part.
   */
  const handleVersionChange = (part: 'major' | 'minor' | 'patch', value: string) => {
    if (/^\d*$/.test(value)) { // Ensure only numbers are entered
      setVersionParts((prev) => ({ ...prev, [part]: value }));
    }
  };

  /**
   * Handles the download button click event.
   * Validates the inputs and simulates a file download based on the provided package name and version.
   */
  const handleDownload = () => {
    const { major, minor, patch } = versionParts;

    if (!packageName || !major || !minor || !patch) {
      alert('Please provide a package name and complete version (major.minor.patch).');
      return;
    }

    const version = `${major}.${minor}.${patch}`;
    const filePath = `/packages/${packageName}-${version}.zip`; // Update this path according to your backend file structure

    // Simulate file download
    const link = document.createElement('a');
    link.href = filePath;
    link.download = `${packageName}-${version}.zip`;
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
          aria-label="Enter the package name"
          required
        />

        <label htmlFor="package-version" className="file-input-label">
          Package Version:
        </label>
        <div className="version-input-group">
          <input
            id="major-version"
            className="version-input"
            type="text"
            placeholder="0"
            value={versionParts.major}
            onChange={(e) => handleVersionChange('major', e.target.value)}
            required
            aria-label="Major version"
          />
          <span className="version-separator">.</span>
          <input
            id="minor-version"
            className="version-input"
            type="text"
            placeholder="0"
            value={versionParts.minor}
            onChange={(e) => handleVersionChange('minor', e.target.value)}
            required
            aria-label="Minor version"
          />
          <span className="version-separator">.</span>
          <input
            id="patch-version"
            className="version-input"
            type="text"
            placeholder="0"
            value={versionParts.patch}
            onChange={(e) => handleVersionChange('patch', e.target.value)}
            required
            aria-label="Patch version"
          />
        </div>

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
