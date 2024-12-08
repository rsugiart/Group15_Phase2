import React, { useEffect, useState } from 'react';
import './view_registry.css';

interface RegistryEntry {
  Name: string;
  Version: string;
  ID: string;
}

export interface ViewRegistryPageProps {
  token: string;
}

const ViewRegistryPage: React.FC<ViewRegistryPageProps> = ({ token }) => {
  const [registryData, setRegistryData] = useState<RegistryEntry[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchRegistryData = async () => {
      setMessage('Fetching registry data...');
      try {
        const response = await fetch('/api/registry', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch registry data');
        }

        const data: RegistryEntry[] = await response.json();
        setRegistryData(data);
        setMessage('');
      } catch (error) {
        setMessage('Error fetching data. Please try again.');
        console.error(error);
      }
    };

    fetchRegistryData();
  }, [token]);

  return (
    <main className="view_registry-container">
      <h1 className="view_registry-title" tabIndex={0}>
        Package Registry
      </h1>
      {message && (
        <div
          className="view_registry-message"
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}
      {registryData.length > 0 ? (
        <table className="view_registry-results-table">
          <caption className="table-caption">List of Registered Packages</caption>
          <thead>
            <tr>
              <th scope="col">Package Name</th>
              <th scope="col">Version</th>
              <th scope="col">ID</th>
            </tr>
          </thead>
          <tbody>
            {registryData.map((entry, index) => (
              <tr key={index}>
                <td>{entry.Name}</td>
                <td>{entry.Version}</td>
                <td>{entry.ID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !message && <p>No data available.</p>
      )}
    </main>
  );
};

export default ViewRegistryPage;
