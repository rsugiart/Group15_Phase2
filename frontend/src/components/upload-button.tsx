
import React, { useState } from 'react';
import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config()
import JSZip from "jszip";

/**
 * PackageUpload component for uploading a zip file and associating it with a package name.
 * Converts the file to a base64 string and sends it to an API.
 *
 * @returns {JSX.Element} - The rendered PackageUpload component.
 */
const PackageUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    // const [base64, setBase64] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [packageName, setPackageName] = useState<string>('');

    /**
     * Handles the selection of a zip file and updates the state.
     * Displays an error message if the selected file is not a zip file.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
     */
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/zip') {
            setFile(selectedFile);
            setMessage('');
        } else {
            setFile(null);
            setMessage('Please select a zip file.');
        }
    };

    /**
     * Handles changes to the package name input field and updates the state.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event - The text input change event.
     */
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value;
        if (input) {
            setPackageName(input)
        } else {
            console.error("No Input")
        }

    };

     /**
     * Converts a file to a base64 string.
     *
     * @param {File} file - The file to be converted.
     * @returns {Promise<string>} - A promise that resolves to the base64 string representation of the file.
     */
    const covertToBase64 = (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    const upload = async () => {
        setMessage('')
        if (!file) {
            setMessage('No file selected.');
            return;
        }
        const base64String = await covertToBase64(file);
        // setBase64(base64Stirng);
        const modifiedBase64String = (base64String.split('data:application/zip;base64,'))[1];
        try {
            console.log(packageName)
            const response = await fetch(`https://t65oyfcrxb.execute-api.us-east-1.amazonaws.com/package`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({Name: packageName,Content: modifiedBase64String})
            });
            const result = await response.json();
            console.log(result.message)
            // setMessage(result.message)
            
        }
        catch (error) {
            setMessage("erro")
        }
        
    }

    return (
        <div>
            <input type="file" accept=".zip" onChange={handleFileChange} />
            <input type="text" onChange={handleInputChange}/>
            <button onClick={upload}>Upload</button>
            {message && <h3> {message}</h3>}
            {/* <div style={{ marginTop: '20px' }}>
                {image && <img src={a} alt={message} width="80%" height="auto" />}
            </div> */}
        </div>
    );
}

export default PackageUpload