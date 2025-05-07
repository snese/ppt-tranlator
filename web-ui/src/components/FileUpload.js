import React, { useState } from 'react';
import { S3Service } from '../services/aws-service';
import awsConfig from '../aws-exports';

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
        console.log(`[${new Date().toISOString()}] Invalid file type selected: ${file.name}`);
        return;
      }
      setSelectedFile(file);
      console.log(`[${new Date().toISOString()}] File selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      console.log(`[${new Date().toISOString()}] Upload attempted without file selection`);
      return;
    }

    try {
      setUploading(true);
      console.log(`[${new Date().toISOString()}] Starting upload for file: ${selectedFile.name}`);
      
      // Generate a unique file name to prevent overwriting
      const timestamp = new Date().getTime();
      const uniqueFileName = `${timestamp}-${selectedFile.name}`;
      
      // Get presigned URL
      const { uploadURL, fileKey } = await S3Service.getPresignedUploadUrl(
        S3_BUCKET_NAME,
        uniqueFileName,
        selectedFile.type
      );

      // Simulate upload progress (in a real app you'd use XMLHttpRequest with progress event)
      for (let i = 0; i <= 90; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Upload file using presigned URL
      await S3Service.uploadFileWithPresignedUrl(uploadURL, selectedFile);
      
      setUploadProgress(100);
      
      // Notify parent component that file upload is complete
      onFileUploaded(fileKey, selectedFile.name);
      console.log(`[${new Date().toISOString()}] Upload completed for file: ${selectedFile.name}, File Key: ${fileKey}`);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error uploading file:`, error);
      onError(`File upload failed: ${error.message}`);
      console.log(`[${new Date().toISOString()}] Upload failed for file: ${selectedFile.name}`);
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
      
      {selectedFile && (
        <div className="file-info">
          <p>Selected file: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;