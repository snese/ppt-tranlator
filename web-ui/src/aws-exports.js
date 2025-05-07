/*
 * AWS configuration for the PowerPoint Translator app.
 * These values are automatically updated by the deploy-and-update.sh script
 * from the deployed AWS infrastructure.
 */

const awsConfig = {
  region: 'us-west-2', // Confirmed as correct
  apiGateway: {
    endpoint: 'REPLACE_THIS', // Updated with deployed API Gateway endpoint
    region: 'us-west-2' // Confirmed as correct
  },
  s3: {
    originalBucket: 'REPLACE_THIS', // Updated with correct bucket name
    translatedBucket: 'REPLACE_THIS' // Updated with correct bucket name
  },
  cloudfront: {
    domain: 'REPLACE_THIS' // Updated with CloudFront distribution domain
  }
};

export default awsConfig;
