/*
 * AWS configuration for the PowerPoint Translator app.
 * These values need to be updated with the actual configuration
 * from the deployed AWS infrastructure (Cognito User Pool ID, Client ID, etc.).
 */

const awsConfig = {
  region: 'us-west-2', // Confirmed as correct
  apiGateway: {
    endpoint: 'https://placeholder-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod/', // Updated with placeholder for testing
    region: 'us-west-2' // Confirmed as correct
  },
  s3: {
    originalBucket: 'ppt-translation-original', // Updated with correct bucket name
    translatedBucket: 'ppt-translation-translated' // Updated with correct bucket name
  },
  cloudfront: {
    domain: 'd1iym54zzxthz.cloudfront.net' // Updated with CloudFront distribution domain
  }
};

export default awsConfig;
