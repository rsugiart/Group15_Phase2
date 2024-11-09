
import React, { useState } from 'react';
import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config()
import JSZip from "jszip";


const PackageUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    // const [base64, setBase64] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [packageName, setPackageName] = useState<string>('');


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
        setPackageName('underscore')
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
            
        }
        catch (error) {
            setMessage(String(error))
        }
        
    }

    return (
        <div>
            <input type="file" accept=".zip" onChange={handleFileChange} />
            <button onClick={upload}>Upload</button>
            {message && <h3> {message}</h3>}
            {/* <div style={{ marginTop: '20px' }}>
                {image && <img src={a} alt={message} width="80%" height="auto" />}
            </div> */}
        </div>
    );
}

export default PackageUpload