<h1>Playwright Authentication with AAD and MSAL.js</h1>

<h3>Background</h3>
Out of the box, Playwright struggles to work with single page applications that authenticate to Azure Active Directory using the MSAL.JS library. Best practice recommends against interacting with the AAD login flow UI directly as this is not under your control and can lead to increased test fragility. This sample application demonstrates an alternative approach.

<h3>Setup</h3>
<i>AAD Configuration</i>




<h3>Credits</h3>
This approach was derived from the following post illustrating how to do the same thing using Cypress instead of Playwright - [https://medium.com/version-1/using-cypress-to-test-azure-active-directory-protected-spas-47d04f5add9]