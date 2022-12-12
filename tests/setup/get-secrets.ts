import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import TestAuthConfig from "./auth-config";

const credential = new DefaultAzureCredential();

// Build the URL to reach your key vault
const url = `https://${TestAuthConfig.keyVault}.vault.azure.net`;

// Lastly, create our secrets client and connect to the service
const client = new SecretClient(url, credential);

export const getClientSecret = async () => {
    return (await client.getSecret(TestAuthConfig.clientSecret)).value;
};

export const getPassword = async () => {
    return (await client.getSecret(TestAuthConfig.password)).value;
};