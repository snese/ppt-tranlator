/*
 * AWS configuration for the PowerPoint Translator app.
 * These values need to be updated with the actual configuration
 * from the deployed AWS infrastructure (Cognito User Pool ID, Client ID, etc.).
 */

const awsConfig = {
  region: 'us-west-2', // Confirmed as correct
  userPoolId: 'us-west-2_jmOvwV6EP', // Confirmed as correct
  userPoolWebClientId: '4ccbjckp34s7p3molj0p9du2nr', // Confirmed as correct
  cookieStorage: {
    // Required for Cognito auth to work with CloudFront
    domain: window.location.hostname,
    path: '/',
    expires: 365,
    sameSite: "strict",
    secure: true
  },
  // Commented out OAuth configuration as authentication is removed
  /*
  oauth: {
    domain: 'ppt-translation.auth.us-west-2.amazoncognito.com', // Updated with Cognito hosted UI domain
    scope: ['email', 'profile', 'openid'],
    redirectSignIn: 'http://localhost:3000/', // Updated for local testing
    redirectSignOut: 'http://localhost:3000/', // Updated for local testing
    responseType: 'code' // or 'token', depending on your setup
  },
  */
  apiGateway: {
    endpoint: 'https://api.ppt-translation.com', // Updated with API Gateway endpoint
    region: 'us-west-2' // Confirmed as correct
  },
  s3: {
    originalBucket: 'ppt-translation-original-cdkstack-e5i9c', // Placeholder, to be updated post-deployment
    translatedBucket: 'ppt-translation-translated-cdkstack-e5i9c' // Placeholder, to be updated post-deployment
  }
};

export default awsConfig;
