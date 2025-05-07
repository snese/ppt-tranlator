import { fetch } from 'whatwg-fetch';
import Logger from '../utils/logger';

// API Service for handling interactions with backend Lambda functions via API Gateway
export const ApiService = {
  // Base API endpoint - using endpoint from aws-exports.js
  baseUrl: require('../aws-exports').default.apiGateway.endpoint,
  
  // Log the base URL to confirm which endpoint is being used
  logBaseUrl: function() {
    Logger.info(`API Base URL: ${this.baseUrl}`);
    return this.baseUrl;
  },
  
  // Make a request to the API
  async makeRequest(endpoint, method = 'GET', body = null) {
    // Generate a unique request ID for tracing
    const requestId = Logger.generateRequestId();
    
    // Ensure endpoint doesn't start with a slash to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Temporarily remove X-Request-ID header until backend is updated
        // 'X-Request-ID': requestId
      },
      mode: 'cors',
      credentials: 'omit' // Changed from 'include' to 'omit' to work with wildcard CORS
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      // Construct the URL properly to avoid double slashes
      const baseUrlWithoutTrailingSlash = this.baseUrl.endsWith('/') 
        ? this.baseUrl.slice(0, -1) 
        : this.baseUrl;
      
      const url = `${baseUrlWithoutTrailingSlash}/${cleanEndpoint}`;
      
      // Log the full URL and request body before making the request
      Logger.info(`[${requestId}] API Request initiated`, {
        url,
        method,
        headers: options.headers,
        body: body
      });
      
      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      
      // Log response status and timing
      Logger.info(`[${requestId}] API Response received in ${endTime - startTime}ms`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`[${requestId}] API request failed`, {
          status: response.status,
          error: errorText
        });
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      Logger.debug(`[${requestId}] API Response data`, responseData);
      
      return responseData;
    } catch (error) {
      Logger.error(`Error making ${method} request to ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Get a presigned URL for uploading a file to S3
  async getPresignedUploadUrl(filename, fileType) {
    try {
      Logger.info(`Getting presigned upload URL for file: ${filename}`);
      
      // Generate a unique key for the file
      const timestamp = Date.now();
      const fileKey = `${timestamp}-${filename}`;
      
      // Request a presigned URL from the backend
      const data = await this.makeRequest('presigned-upload-url', 'POST', {
        bucket_name: 'ppt-translation-original',
        object_key: fileKey,
        fileType: fileType,
        operation: 'put_object'
      });
      
      Logger.info(`Received presigned upload URL for file: ${fileKey}`);
      
      return {
        uploadUrl: data.presigned_url,
        fileKey: fileKey
      };
    } catch (error) {
      Logger.error('Error getting presigned upload URL:', error);
      throw error;
    }
  },
  
  // Get a presigned URL for downloading a file from S3
  async getPresignedDownloadUrl(fileKey) {
    try {
      Logger.info(`Getting presigned download URL for file: ${fileKey}`);
      
      // Request a presigned URL from the backend
      const data = await this.makeRequest('presigned-download-url', 'POST', {
        bucket_name: 'ppt-translation-translated',
        object_key: fileKey,
        operation: 'get_object'
      });
      
      Logger.info(`Received presigned download URL for file: ${fileKey}`);
      
      return data.presigned_url;
    } catch (error) {
      Logger.error('Error getting presigned download URL:', error);
      throw error;
    }
  }
};

// Translation status service
export const TranslationService = {
  // Request translation of a file via API Gateway
  async requestTranslation(fileKey, sourceLanguage, targetLanguage) {
    try {
      Logger.info(`Requesting translation for file: ${fileKey}`);
      Logger.info(`Source language: ${sourceLanguage}, Target language: ${targetLanguage}`);
      
      const data = await ApiService.makeRequest('translate', 'POST', {
        fileKey,
        sourceLanguage,
        targetLanguage
      });
      
      Logger.info(`Translation request response:`, data);
      
      if (!data.jobId) {
        Logger.error(`No jobId returned from translation request`);
        throw new Error('No job ID returned from translation service');
      }
      
      return data.jobId;
    } catch (error) {
      Logger.error('Error requesting translation:', error);
      throw error;
    }
  },
  
  // Poll for translation status via API Gateway
  async checkTranslationStatus(jobId) {
    try {
      Logger.info(`Checking translation status for job: ${jobId}`);
      
      const data = await ApiService.makeRequest(`status?jobId=${encodeURIComponent(jobId)}`);
      
      Logger.info(`Translation status for job ${jobId}: ${data.status}`);
      
      return data.status;
    } catch (error) {
      Logger.error('Error checking translation status:', error);
      throw error;
    }
  },
  
  // Get translation result via API Gateway
  async getTranslationResult(jobId) {
    try {
      Logger.info(`Getting translation result for job: ${jobId}`);
      
      const data = await ApiService.makeRequest(`result?jobId=${encodeURIComponent(jobId)}`);
      
      Logger.info(`Translation result for job ${jobId}:`, data);
      
      return data;
    } catch (error) {
      Logger.error('Error getting translation result:', error);
      throw error;
    }
  }
};
