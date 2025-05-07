import React, { useState } from 'react';
import { S3Service } from '../services/aws-service';
import awsConfig from '../aws-exports';

// Configuration - using bucket name from aws-exports
const S3_BUCKET_NAME = awsConfig.s3.translatedBucket || 'TRANSLATED_FILES_BUCKET_PLACEHOLDER';

const DownloadButton = ({ fileKey, originalFilename }) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState(null);

  // Generate display filename for the translated file
  const getDisplayFilename = () => {
    if (!originalFilename) return 'translated-file.pptx';
    
    // Extract filename without extension
    const nameWithoutExt = originalFilename.replace(/\.(ppt|pptx)$/, '');
    return `${nameWithoutExt}-translated.pptx`;
  };

  const handleDownload = async () => {
    if (!fileKey) {
      setError('No file available for download');
      console.log(`[${new Date().toISOString()}] Download attempted without file key`);
      return;
    }

    try {
      setIsGeneratingLink(true);
      setError(null);
      console.log(`[${new Date().toISOString()}] Starting download process for file key: ${fileKey}`);
      
      // Get presigned download URL
      const downloadURL = await S3Service.getPresignedDownloadUrl(
        S3_BUCKET_NAME,
        fileKey
      );
      
      // Open the URL in a new tab or initiate download
      // For most browsers, this will start a download
      window.open(downloadURL, '_blank');
      console.log(`[${new Date().toISOString()}] Download URL opened for file key: ${fileKey}`);
      
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Failed to generate download link:`, err);
      setError('Failed to generate download link');
      console.log(`[${new Date().toISOString()}] Download failed for file key: ${fileKey}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="download-button-container">
      <button 
        className="download-button"
        onClick={handleDownload}
        disabled={isGeneratingLink || !fileKey}
      >
        {isGeneratingLink 
          ? 'Generating download link...' 
          : `Download ${getDisplayFilename()}`
        }
      </button>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default DownloadButton;