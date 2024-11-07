import { url } from 'inspector';
import React, {useState } from 'react';

const SearchButton: React.FC = () => {
    const [packageUrl, setPackageUrl] = useState<string>('');
    const [packageName, setPackageName] = useState<string>('');
    const [image, setImage] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const getPackageName = (url: string) => {
        const mod = url.substring(19);
        const sep = mod.indexOf('/');
        const name = mod.substring(sep+1);
        return name
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value;
        if (input) {
            setPackageUrl(input)
        } else {
            console.error("No Input")
        }

    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            upload(); 
        }
    };

    const upload = async () => {

        if (!packageUrl) {
            setMessage('No Input');
            return;
        }
        const packageName = getPackageName(packageUrl);
        setPackageName(packageName);

        try {
            const response = await fetch(`https://t65oyfcrxb.execute-api.us-east-1.amazonaws.com/package`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({Name: packageName,url:packageUrl})
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
            <input type="text" onChange={handleInputChange} onKeyDown={handleKeyDown}/>
            <button onClick={upload}>Search</button>
            {message && <h3> {message}</h3>}
        </div>
    );
}

export default SearchButton