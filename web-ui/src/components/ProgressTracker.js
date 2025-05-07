import React, { useState, useEffect, useMemo } from 'react';
import { TranslationService } from '../services/aws-service';
import Logger from '../utils/logger';

const ProgressTracker = ({ jobId, onTranslationComplete, onTranslationFailed }) => {
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const statusToProgress = useMemo(() => ({
    'pending': 20,
    'processing': 60,
    'completed': 100,
    'failed': 0
  }), []);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const currentStatus = await TranslationService.checkTranslationStatus(jobId);
        setStatus(currentStatus);
        setProgress(statusToProgress[currentStatus] || 0);
        Logger.info(`Translation status for Job ID ${jobId}: ${currentStatus}, Progress: ${statusToProgress[currentStatus] || 0}%`);

        if (currentStatus === 'completed') {
          try {
            const fileKey = await TranslationService.getTranslatedFileKey(jobId);
            Logger.info(`Translation completed for Job ID ${jobId}, File Key: ${fileKey}`);
            onTranslationComplete && onTranslationComplete(fileKey);
          } catch (fileKeyError) {
            Logger.error(`Error getting translated file key for Job ID ${jobId}:`, fileKeyError);
            setError(`Error retrieving translated file: ${fileKeyError.message}`);
          }
        } else if (currentStatus === 'failed') {
          setError('Translation failed. Please try again.');
          Logger.warn(`Translation failed for Job ID ${jobId}`);
          onTranslationFailed && onTranslationFailed('Translation process failed');
        } else {
          // If still processing, continue polling
          Logger.info(`Continuing to poll status for Job ID ${jobId}`);
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        setError(`Error checking translation status: ${err.message}`);
        Logger.error(`Error checking translation status for Job ID ${jobId}:`, err);
        onTranslationFailed && onTranslationFailed(err.message);
      }
    };

    checkStatus();
  }, [jobId, onTranslationComplete, onTranslationFailed, statusToProgress]);

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