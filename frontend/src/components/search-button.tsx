import { url } from 'inspector';
import React, {useState,FC } from 'react';
import { SearchPageProps } from '../pages/Search/Search';

const SearchButton: React.FC<SearchPageProps> = ({token}) => {
    const [packageUrl, setPackageUrl] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const getPackageNameGithub = (url: string):string => {
        const mod = url.substring(19);
        const sep = mod.indexOf('/');
        const name = mod.substring(sep+1);
        return name
    }
    //getting package name from npm url
    const getPackageNameNpm= async (url: string):Promise<string> => {
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

    const download = async () => {  

        try {
            const response = await fetch(`https://t65oyfcrxb.execute-api.us-east-1.amazonaws.com/package/lodash`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Authorization": "bearer " + token
              }
            });
            const result = await response.json();
            const content = result.data.Content;
            console.log(content)
            const response_2  = await fetch(`https://t65oyfcrxb.execute-api.us-east-1.amazonaws.com/package/download`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({name: 'lodash',version: '4.17.21',content: content})
              });
            const blob = await response_2.blob()
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'package.zip';
            link.click();
            
        }
        catch (error) {
            setMessage(String(error))
        }

    }

    const upload = async () => {

        if (!packageUrl) {
            setMessage('No Input');
            return;
        }
        let packageName = "";
        if (packageUrl.includes("npmjs.com/package")) {
            packageName = await getPackageNameNpm(packageUrl);
            console.log(packageName)
        }
        else if (packageUrl.includes("github.com")) {
            packageName = getPackageNameGithub(packageUrl);
        }
        try {
            console.log("token:", token)
            console.log("package name:", packageName)
            const response = await fetch(`https://iyi2t3azi4.execute-api.us-east-1.amazonaws.com/package`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Authorization": "bearer " + token
              },
              body: JSON.stringify({Name: packageName,URL:packageUrl})
            });
            const result = await response.json();
            console.log(result)
            
        }
        catch (error) {
            console.log(error)
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