// AWS configuration for the web application
const awsConfig = {
  // API Gateway configuration
  apiGateway: {
    endpoint: 'https://vrxgq5llsh.execute-api.us-west-2.amazonaws.com/prod',
    region: 'us-west-2'
  },
  // S3 bucket configuration
  s3: {
    originalBucket: 'ppt-translation-original',
    translatedBucket: 'ppt-translation-translated',
    region: 'us-west-2'
  }
};

export default awsConfig;
