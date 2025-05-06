import React, { useState } from 'react';
import { S3Service } from '../services/aws-service';

// Configuration - would come from environment variables in production
const S3_BUCKET_NAME = 'XXXXXXXXXXXXXXXXXXXXXXXXX'; // Replace with your actual bucket name

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
      return;
    }

    try {
      setIsGeneratingLink(true);
      setError(null);
      
      // Get presigned download URL
      const downloadURL = await S3Service.getPresignedDownloadUrl(
        S3_BUCKET_NAME,
        fileKey
      );
      
      // Open the URL in a new tab or initiate download
      // For most browsers, this will start a download
      window.open(downloadURL, '_blank');
      
    } catch (err) {
      console.error('Failed to generate download link:', err);
      setError('Failed to generate download link');
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