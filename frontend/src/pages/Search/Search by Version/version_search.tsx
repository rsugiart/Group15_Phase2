import React, { useState } from 'react';
import './version_search.css';

interface RegistryEntry {
  Name: string;
  Version: string;
  ID: string;
}

const SearchByVersionPage: React.FC = () => {
  const [packageName, setPackageName] = useState<string>('');
  const [versionParts, setVersionParts] = useState<{ major: string; minor: string; patch: string }>({
    major: '',
    minor: '',
    patch: '',
  });
  const [results, setResults] = useState<RegistryEntry | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleVersionChange = (part: 'major' | 'minor' | 'patch', value: string) => {
    if (/^\d*$/.test(value)) {
      setVersionParts((prev) => ({ ...prev, [part]: value }));
    }
  };

  const handleSearch = async () => {
    const { major, minor, patch } = versionParts;

    if (!packageName || !major || !minor || !patch) {
      setMessage('Please provide a package name and complete version (major.minor.patch).');
      return;
    }

    setMessage('Searching...');
    const version = `${major}.${minor}.${patch}`;
    try {
      const response = await fetch(`/api/search?name=${packageName}&version=${version}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: RegistryEntry = await response.json();
      setResults(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching data. Please try again.');
      console.error(error);
    }
  };

  return (
    <main className="search_by_version-container">
      <h1 className="search_by_version-title">Search Package by Version</h1>
      <section className="search_by_version-input-container">
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
          aria-required="true"
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
            aria-labelledby="package-version-label"
            aria-required="true"
          />
          <span className="version-separator">.</span>
          <input
            id="minor-version"
            className="version-input"
            type="text"
            placeholder="0"
            value={versionParts.minor}
            onChange={(e) => handleVersionChange('minor', e.target.value)}
            aria-labelledby="package-version-label"
            aria-required="true"
          />
          <span className="version-separator">.</span>
          <input
            id="patch-version"
            className="version-input"
            type="text"
            placeholder="0"
            value={versionParts.patch}
            onChange={(e) => handleVersionChange('patch', e.target.value)}
            aria-labelledby="package-version-label"
            aria-required="true"
          />
        </div>

        <button
          className="search_by_version-button"
          onClick={handleSearch}
          aria-label="Search for the specified package and version"
        >
          Search
        </button>
      </section>

      {message && (
        <div
          className="search_by_version-message"
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {results && (
        <table className="search_by_version-results-table">
          <caption className="table-caption">
            Search Results
          </caption>
          <thead>
            <tr>
              <th scope="col">Package Name</th>
              <th scope="col">Version</th>
              <th scope="col">ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{results.Name}</td>
              <td>{results.Version}</td>
              <td>{results.ID}</td>
            </tr>
          </tbody>
        </table>
      )}
    </main>
  );
};

export default SearchByVersionPage;
