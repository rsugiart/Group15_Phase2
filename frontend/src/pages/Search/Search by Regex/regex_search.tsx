import React, { useState } from 'react';
import './regex_search.css';

interface RegistryEntry {
  Name: string;
  Version: string;
  ID: string;
}

/**
 * SearchByRegexPage component allows users to search the package registry using a regular expression pattern.
 * Displays the search results in a table format with package name, version, and ID.
 *
 * @returns {JSX.Element} - The rendered SearchByRegexPage component.
 */
const SearchByRegexPage: React.FC = () => {
  const [regex, setRegex] = useState<string>('');
  const [results, setResults] = useState<RegistryEntry[]>([]);
  const [message, setMessage] = useState<string>('');

  /**
   * Handles the search functionality by making a request to the backend
   * with the provided regex pattern and updates the results state.
   */
  const handleSearch = async () => {
    if (!regex) {
      setMessage('Please enter a valid regex string.');
      return;
    }

    setMessage('Searching...');
    try {
      const response = await fetch(`/api/regex_search?pattern=${encodeURIComponent(regex)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: RegistryEntry[] = await response.json();
      setResults(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching data. Please try again.');
      console.error(error);
    }
  };

  return (
    <main className="search_by_regex-container">
      <h1 className="search_by_regex-title">Search Packages by Regex</h1>
      <section className="search_by_regex-input-container">
        <label htmlFor="regex-input" className="file-input-label">
          Enter Regex String:
        </label>
        <input
          id="regex-input"
          className="text-input"
          type="text"
          placeholder="Enter a valid regex"
          value={regex}
          onChange={(e) => setRegex(e.target.value)}
          aria-required="true"
        />

        <button
          className="search_by_regex-button"
          onClick={handleSearch}
          aria-label="Search using the specified regex pattern"
        >
          Search
        </button>
      </section>

      {message && (
        <div
          className="search_by_regex-message"
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {results.length > 0 && (
        <table className="search_by_regex-results-table">
          <caption className="table-caption">Search Results</caption>
          <thead>
            <tr>
              <th scope="col">Package Name</th>
              <th scope="col">Version</th>
              <th scope="col">ID</th>
            </tr>
          </thead>
          <tbody>
            {results.map((entry, index) => (
              <tr key={index}>
                <td>{entry.Name}</td>
                <td>{entry.Version}</td>
                <td>{entry.ID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default SearchByRegexPage;
