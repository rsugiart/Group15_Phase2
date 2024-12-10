import {jwtDecode} from 'jwt-decode';


export const checkTokenExpiration = (token: string): boolean => {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      return decoded.exp > currentTime; // Returns true if the token is valid
    } catch (error) {
      console.error("Invalid token:", error);
      return false; // Return false if the token is invalid
    }
  };


  