import React, { useState } from 'react';
import { ApiService } from '../services/aws-service';
import awsConfig from '../aws-exports';
import Logger from '../utils/logger';

// Configuration - using bucket name from aws-exports
const S3_BUCKET_NAME = awsConfig.s3.originalBucket || 'ORIGINAL_FILES_BUCKET_PLACEHOLDER';

const FileUpload = ({ onFileUploaded, onError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is a PowerPoint file
      if (!file.name.endsWith('.ppt') && !file.name.endsWith('.pptx')) {
        alert('Please select a PowerPoint file (.ppt or .pptx)');
        event.target.value = null;
        Logger.warn(`Invalid file type selected: ${file.name}`);
        return;
      }
      setSelectedFile(file);
      Logger.info(`File selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      Logger.warn(`Upload attempted without file selection`);
      return;
    }

    try {
      setUploading(true);
      Logger.info(`Starting upload for file: ${selectedFile.name}`);
      
      // Get presigned URL for upload
      const { uploadUrl, fileKey } = await ApiService.getPresignedUploadUrl(
        selectedFile.name,
        selectedFile.type
      );

      // Simulate upload progress (in a real app you'd use XMLHttpRequest with progress event)
      const simulateProgress = async () => {
        for (let i = 0; i <= 90; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      };
      
      await simulateProgress();
      
      // Upload file using presigned URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      setUploadProgress(100);
      
      // Notify parent component that file upload is complete
      onFileUploaded(fileKey, selectedFile.name);
      Logger.info(`Upload completed for file: ${selectedFile.name}, File Key: ${fileKey}`);
      
    } catch (error) {
      Logger.error(`Error uploading file:`, error);
      onError(`File upload failed: ${error.message}`);
      Logger.warn(`Upload failed for file: ${selectedFile.name}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h3>Upload PowerPoint File</h3>
      <div className="upload-controls">
        <input
          type="file"
          accept=".ppt,.pptx"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <progress value={uploadProgress} max="100"></progress>
          <span>{uploadProgress}%</span>
        </div>
      )}
      
      {selectedFile && !uploading && (
        <div className="file-info">
          <p>Selected file: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
