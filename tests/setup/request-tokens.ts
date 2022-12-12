import axios from "axios";

export const getTokens = async (authSettings, scopes: string[]) => {
    // make the ROPC request to AAD
    const payload = {
        grant_type: "password",
        client_id: authSettings.clientId,
        client_secret: authSettings.clientSecret,
        scope: scopes.join(" "),
        username: authSettings.username,
        password: authSettings.password
    }
  
    const url = `${authSettings.authority}/oauth2/v2.0/token`;
    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        
        return response.data;
    } catch (err) {
        console.error(err);
    }
  }