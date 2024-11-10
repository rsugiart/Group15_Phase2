import { url } from 'inspector';
import React, {useState } from 'react';

const SearchButton: React.FC = () => {
    const [packageUrl, setPackageUrl] = useState<string>('');
    const [packageName, setPackageName] = useState<string>('');
    const [image, setImage] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const getPackageNameGithub = (url: string):string => {
        const mod = url.substring(19);
        const sep = mod.indexOf('/');
        const name = mod.substring(sep+1);
        return name
    }
    //getting package name from npm url
    const getPackageNameNpm= (url: string):string => {
        const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
        const match = url.match(specificVersionRegex);
        if (match) {
            console.log(match[0].split('/v/')[1])
            return url.split(match[0])[0].split('/package/')[1]
        }
        else {
            return url.split('/package/')[1]
        }
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
        if (packageUrl.includes("npmjs.com/package")) {
            const packageName = getPackageNameNpm(packageUrl);
            setPackageName(packageName);
        }
        else if (packageUrl.includes("github.com")) {
            const packageName = getPackageNameGithub(packageUrl);
            setPackageName(packageName)
        }

        try {
            const response = await fetch(`https://t65oyfcrxb.execute-api.us-east-1.amazonaws.com/package`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({Name: packageName,url:packageUrl})
            });
            const result = await response.json();
            console.log(result)
            
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