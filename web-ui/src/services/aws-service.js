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
  // Poll for translation status
  checkTranslationStatus: async (fileKey) => {
    // This would typically be an API call to your backend service
    // that checks the status of the translation job
    
    // For demonstration, we'll simulate a status check
    // In a real application, you would call your API Gateway endpoint
    try {
      // Simulating API call
      // const response = await fetch(`your-api-gateway-url/status?fileKey=${fileKey}`);
      // const data = await response.json();
      // return data.status;
      
      // For now, simulate a random status
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const randomIndex = Math.floor(Math.random() * 3); // Bias toward success for demo
      return statuses[randomIndex];
    } catch (error) {
      console.error('Error checking translation status:', error);
      throw error;
    }
  },
  
  // Request translation of a file
  requestTranslation: async (fileKey, sourceLanguage, targetLanguage) => {
    // This would typically be an API call to your backend service
    // that initiates the translation job
    
    // For demonstration, we'll simulate a request
    try {
      // Simulating API call to Lambda function via API Gateway
      // const response = await fetch('your-api-gateway-url/translate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     fileKey,
      //     sourceLanguage,
      //     targetLanguage
      //   })
      // });
      // const data = await response.json();
      // return data.jobId;
      
      // For now, return the fileKey as the jobId
      return fileKey;
    } catch (error) {
      console.error('Error requesting translation:', error);
      throw error;
    }
  },
  
  // Get the translated file key once processing is complete
  getTranslatedFileKey: async (jobId) => {
    // In real application, you would call your API to get the translated file key
    // For demonstration, we'll simulate a response
    
    try {
      // Simulating API call
      // const response = await fetch(`your-api-gateway-url/result?jobId=${jobId}`);
      // const data = await response.json();
      // return data.translatedFileKey;
      
      // For now, append '-translated' to the original jobId (fileKey)
      return `${jobId}-translated`;
    } catch (error) {
      console.error('Error getting translated file key:', error);
      throw error;
    }
  }
};