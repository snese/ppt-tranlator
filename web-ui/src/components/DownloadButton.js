import React, { useState } from 'react';
import { ApiService } from '../services/aws-service';
import awsConfig from '../aws-exports';
import Logger from '../utils/logger';

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
      Logger.warn(`Download attempted without file key`);
      return;
    }

    try {
      setIsGeneratingLink(true);
      Logger.info(`Generating download link for file: ${fileKey}`);
      
      // Get presigned URL for download
      const downloadUrl = await ApiService.getPresignedDownloadUrl(fileKey);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getDisplayFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Logger.info(`Download initiated for file: ${fileKey}`);
    } catch (error) {
      setError(`Failed to generate download link: ${error.message}`);
      Logger.error(`Error generating download link:`, error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="download-container">
      <button 
        className="download-button"
        onClick={handleDownload}
        disabled={isGeneratingLink || !fileKey}
      >
        {isGeneratingLink ? 'Generating Download Link...' : 'Download Translated File'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default DownloadButton;
