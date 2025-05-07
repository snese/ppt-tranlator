import { fetch } from 'whatwg-fetch';

// API Service for handling interactions with backend Lambda functions via API Gateway
export const ApiService = {
  // Base API endpoint - using endpoint from aws-exports.js
  baseUrl: require('../aws-exports').default.apiGateway.endpoint,
  // Log the base URL to confirm which endpoint is being used
  logBaseUrl: function() {
    console.log(`[${new Date().toISOString()}] API Base URL: ${this.baseUrl}`);
    return this.baseUrl;
  },
  
  // Make a request to the API
  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'same-origin'
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      // Log the full URL and request body before making the request
      console.log(`[${new Date().toISOString()}] Making ${method} request to: ${this.baseUrl}${endpoint}`);
      if (body) {
        console.log(`[${new Date().toISOString()}] Request body:`, JSON.stringify(body));
      }
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
        bucket_name: bucketName,
        object_key: fileName,
        fileType: fileType,
        operation: 'put_object'  // Explicitly request put_object operation
      });
      console.log(`[${new Date().toISOString()}] Response data from presigned-upload-url:`, data);
      
      // Check if we have a presigned POST URL
      if (data.post_data && data.post_data.url && data.post_data.fields) {
        return {
          uploadURL: data.post_data,  // Return the entire data object with url and fields
          fileKey: data.object_key || fileName
        };
      } else {
        return {
          uploadURL: data.presigned_url,
          fileKey: data.object_key || fileName
        };
      }
    } catch (error) {
      console.error('Error getting presigned upload URL:', error);
      throw error;
    }
  },
  
  // Get a presigned URL for downloading a file from S3 by calling Lambda function
  async getPresignedDownloadUrl(bucketName, fileKey) {
    try {
      const data = await ApiService.makeRequest('/presigned-download-url', 'POST', {
        bucket_name: bucketName,
        object_key: fileKey,
        operation: 'get_object'  // Explicitly request get_object operation
      });
      return data.presigned_url;
    } catch (error) {
      console.error('Error getting presigned download URL:', error);
      throw error;
    }
  },
  
  // Upload a file directly to S3 using presigned URL or POST data
  async uploadFileWithPresignedUrl(presignedData, file) {
    try {
      // Check if we have a presigned POST URL (object with url and fields)
      if (presignedData.url && presignedData.fields) {
        console.log(`[${new Date().toISOString()}] Uploading file using presigned POST data`);
        
        // Create a FormData object
        const formData = new FormData();
        
        // Add all the fields from the presigned data
        Object.entries(presignedData.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Add the file as the last field
        formData.append('file', file);
        
        // Upload using POST
        const response = await fetch(presignedData.url, {
          method: 'POST',
          body: formData,
          mode: 'cors'
        });
        
        if (response.ok) {
          console.log(`[${new Date().toISOString()}] File uploaded successfully using POST`);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`[${new Date().toISOString()}] Upload failed with status: ${response.status}, Error: ${errorText}`);
          throw new Error(`Upload failed with status: ${response.status}`);
        }
      } else {
        // Fall back to the old PUT method
        console.log(`[${new Date().toISOString()}] Uploading file to presigned URL: ${presignedData}`);
        
        const response = await fetch(presignedData, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          },
          mode: 'cors'
        });
        
        if (response.ok) {
          console.log(`[${new Date().toISOString()}] File uploaded successfully using PUT`);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`[${new Date().toISOString()}] Upload failed with status: ${response.status}, Error: ${errorText}`);
          throw new Error(`Upload failed with status: ${response.status}`);
        }
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
      console.log(`[${new Date().toISOString()}] Requesting translation for file: ${fileKey}`);
      console.log(`[${new Date().toISOString()}] Source language: ${sourceLanguage}, Target language: ${targetLanguage}`);
      
      const data = await ApiService.makeRequest('/translate', 'POST', {
        fileKey,
        sourceLanguage,
        targetLanguage
      });
      
      console.log(`[${new Date().toISOString()}] Translation request response:`, data);
      
      if (!data.jobId) {
        console.error(`[${new Date().toISOString()}] No jobId returned from translation request`);
        throw new Error('No job ID returned from translation service');
      }
      
      return data.jobId;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error requesting translation:`, error);
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
