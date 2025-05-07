import { fetch } from 'whatwg-fetch';

// API Service for handling interactions with backend Lambda functions via API Gateway
export const ApiService = {
  // Base API endpoint - to be replaced with actual API Gateway endpoint
  baseUrl: process.env.REACT_APP_API_GATEWAY_URL || 'https://placeholder-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod',
  
  // Make a request to the API
  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error making ${method} request to ${endpoint}:`, error);
      throw error;
    }
  }
};

// S3 Service for handling file uploads and downloads via presigned URLs
export const S3Service = {
  // Get a presigned URL for uploading a file to S3 by calling Lambda function
  async getPresignedUploadUrl(bucketName, fileName, fileType) {
    try {
      const data = await ApiService.makeRequest('/presigned-upload-url', 'POST', {
        bucketName,
        fileName,
        fileType
      });
      return {
        uploadURL: data.uploadURL,
        fileKey: data.fileKey
      };
    } catch (error) {
      console.error('Error getting presigned upload URL:', error);
      throw error;
    }
  },
  
  // Get a presigned URL for downloading a file from S3 by calling Lambda function
  async getPresignedDownloadUrl(bucketName, fileKey) {
    try {
      const data = await ApiService.makeRequest('/presigned-download-url', 'POST', {
        bucketName,
        fileKey
      });
      return data.downloadURL;
    } catch (error) {
      console.error('Error getting presigned download URL:', error);
      throw error;
    }
  },
  
  // Upload a file directly to S3 using presigned URL
  async uploadFileWithPresignedUrl(presignedUrl, file) {
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
  // Request translation of a file via API Gateway
  async requestTranslation(fileKey, sourceLanguage, targetLanguage) {
    try {
      const data = await ApiService.makeRequest('/translate', 'POST', {
        fileKey,
        sourceLanguage,
        targetLanguage
      });
      return data.jobId;
    } catch (error) {
      console.error('Error requesting translation:', error);
      throw error;
    }
  },
  
  // Poll for translation status via API Gateway
  async checkTranslationStatus(jobId) {
    try {
      const data = await ApiService.makeRequest(`/status?jobId=${encodeURIComponent(jobId)}`);
      return data.status;
    } catch (error) {
      console.error('Error checking translation status:', error);
      throw error;
    }
  },
  
  // Get the translated file key once processing is complete via API Gateway
  async getTranslatedFileKey(jobId) {
    try {
      const data = await ApiService.makeRequest(`/result?jobId=${encodeURIComponent(jobId)}`);
      return data.translatedFileKey;
    } catch (error) {
      console.error('Error getting translated file key:', error);
      throw error;
    }
  }
};