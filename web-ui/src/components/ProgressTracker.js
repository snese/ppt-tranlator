import React, { useState, useEffect } from 'react';
import { TranslationService } from '../services/aws-service';

const ProgressTracker = ({ jobId, onTranslationComplete, onTranslationFailed }) => {
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [translatedFileKey, setTranslatedFileKey] = useState(null);

  const statusToProgress = {
    'pending': 20,
    'processing': 60,
    'completed': 100,
    'failed': 0
  };

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const currentStatus = await TranslationService.checkTranslationStatus(jobId);
        setStatus(currentStatus);
        setProgress(statusToProgress[currentStatus] || 0);

        if (currentStatus === 'completed') {
          const fileKey = await TranslationService.getTranslatedFileKey(jobId);
          setTranslatedFileKey(fileKey);
          onTranslationComplete && onTranslationComplete(fileKey);
        } else if (currentStatus === 'failed') {
          setError('Translation failed. Please try again.');
          onTranslationFailed && onTranslationFailed('Translation process failed');
        } else {
          // If still processing, continue polling
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        setError(`Error checking translation status: ${err.message}`);
        onTranslationFailed && onTranslationFailed(err.message);
      }
    };

    checkStatus();
  }, [jobId, onTranslationComplete, onTranslationFailed]);

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Translation starting...';
      case 'processing':
        return 'Translating in progress...';
      case 'completed':
        return 'Translation complete!';
      case 'failed':
        return 'Translation failed';
      default:
        return 'Unknown status';
    }
  };

  if (!jobId) return null;

  return (
    <div className="progress-tracker">
      <h3>Translation Progress</h3>
      
      <div className="progress-bar-container">
        <progress value={progress} max="100"></progress>
        <span>{progress}%</span>
      </div>
      
      <p className="status-message">{getStatusMessage()}</p>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;