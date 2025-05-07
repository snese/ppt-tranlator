import AWS from 'aws-sdk';

// Configure AWS SDK
const configureAWS = (region = 'us-east-1') => {
  AWS.config.update({
    region: region,
    // In production, use proper authentication methods
    // For development, credentials could be provided through environment variables
    // or using Cognito Identity/Amplify
  });
};

// S3 Service for handling file uploads and downloads
export const S3Service = {
  // Generate a presigned URL for uploading a file to S3
  getPresignedUploadUrl: async (bucketName, fileName, fileType) => {
    configureAWS();
    const s3 = new AWS.S3();
    
    const params = {
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
      Expires: 60 * 5 // URL expires in 5 minutes
    };
    
    try {
      const uploadURL = await s3.getSignedUrlPromise('putObject', params);
      return {
        uploadURL,
        fileKey: fileName
      };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  },
  
  // Generate a presigned URL for downloading a file from S3
  getPresignedDownloadUrl: async (bucketName, fileKey) => {
    configureAWS();
    const s3 = new AWS.S3();
    
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: 60 * 5 // URL expires in 5 minutes
    };
    
    try {
      const downloadURL = await s3.getSignedUrlPromise('getObject', params);
      return downloadURL;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw error;
    }
  },
  
  // Upload a file directly to S3 using presigned URL
  uploadFileWithPresignedUrl: async (presignedUrl, file) => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (response.ok) {
        return true;
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error uploading file with presigned URL:', error);
      throw error;
    }
  }
};

// Translation status service
export const TranslationService = {
  // Poll for translation status via API Gateway
  checkTranslationStatus: async (fileKey) => {
    try {
      // Call API Gateway endpoint for status check
      const apiGatewayUrl = process.env.REACT_APP_API_GATEWAY_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
      const response = await fetch(`${apiGatewayUrl}/status?fileKey=${encodeURIComponent(fileKey)}`);
      if (!response.ok) {
        throw new Error(`Status check failed with status: ${response.status}`);
      }
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error checking translation status:', error);
      throw error;
    }
  },
  
  // Request translation of a file via API Gateway
  requestTranslation: async (fileKey, sourceLanguage, targetLanguage) => {
    try {
      // Call API Gateway endpoint to initiate translation
      const apiGatewayUrl = process.env.REACT_APP_API_GATEWAY_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
      const response = await fetch(`${apiGatewayUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          sourceLanguage,
          targetLanguage
        })
      });
      if (!response.ok) {
        throw new Error(`Translation request failed with status: ${response.status}`);
      }
      const data = await response.json();
      return data.jobId;
    } catch (error) {
      console.error('Error requesting translation:', error);
      throw error;
    }
  },
  
  // Get the translated file key once processing is complete via API Gateway
  getTranslatedFileKey: async (jobId) => {
    try {
      // Call API Gateway endpoint to get translated file key
      const apiGatewayUrl = process.env.REACT_APP_API_GATEWAY_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
      const response = await fetch(`${apiGatewayUrl}/result?jobId=${encodeURIComponent(jobId)}`);
      if (!response.ok) {
        throw new Error(`Failed to get translated file key with status: ${response.status}`);
      }
      const data = await response.json();
      return data.translatedFileKey;
    } catch (error) {
      console.error('Error getting translated file key:', error);
      throw error;
    }
  }
};