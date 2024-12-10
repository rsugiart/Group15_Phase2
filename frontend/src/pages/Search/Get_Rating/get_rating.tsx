import React, { useState } from 'react';
import './get_rating.css';

export interface RateParameters {
  BusFactor: number;
  BusFactorLatency: number;
  ResponsiveMaintainer: number;
  ResponsiveMaintainerLatency: number;
  RampUp: number;
  RampUpLatency: number;
  Correctness: number;
  CorrectnessLatency: number;
  LicenseScore: number;
  LicenseScoreLatency: number;
  GoodPinningPractice: number;
  GoodPinningPracticeLatency: number;
  PullRequest: number;
  PullRequestLatency: number;
  NetScore: number;
  NetScoreLatency: number;
}

export interface GetRatingPageProps {
  token: string;
}

const GetRatingPage: React.FC<GetRatingPageProps> = ({ token }) => {
  const [packageName, setPackageName] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [patch, setPatch] = useState('');
  const [results, setResults] = useState<RateParameters | null>(null);
  const [message, setMessage] = useState('');

  const handleGetRating = async () => {
    if (!packageName || !major || !minor || !patch) {
      setMessage('Please fill in all fields.');
      return;
    }

    setMessage('Retrieving Rating...');
    try {
      const version = `${major}.${minor}.${patch}`;
      const response = await fetch(
        `/api/search?name=${packageName}&version=${version}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: RateParameters = await response.json();
      setResults(data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching data. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="get_rating-container">
      <h1 className="get_rating-title">Retrieve Rating for Packages</h1>
      <div className="get_rating-page-version">
        <label className="label">Package Name:</label>
        <input
          className="get_rating-input"
          type="text"
          placeholder="Enter package name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
        />
        <label className="label">Version:</label>
        <div className="version-input-group">
          <input
            className="version-input"
            type="text"
            placeholder="0"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />
          <span className="version-separator">.</span>
          <input
            className="version-input"
            type="text"
            placeholder="0"
            value={minor}
            onChange={(e) => setMinor(e.target.value)}
          />
          <span className="version-separator">.</span>
          <input
            className="version-input"
            type="text"
            placeholder="0"
            value={patch}
            onChange={(e) => setPatch(e.target.value)}
          />
        </div>
        <button className="get_rating-button" onClick={handleGetRating}>
          Get Rating!
        </button>
      </div>
      {message && <div className="get_rating-message">{message}</div>}
      {results && (
        <table className="get_rating-results-table">
          <thead>
            <tr>
              {Object.keys(results).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {Object.values(results).map((value, index) => (
                <td key={index}>{value}</td>
              ))}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GetRatingPage;
