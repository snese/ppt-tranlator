import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import LanguageSelector from './components/LanguageSelector';
import ProgressTracker from './components/ProgressTracker';
import DownloadButton from './components/DownloadButton';
import DebugPanel from './components/DebugPanel';
import { TranslationService } from './services/aws-service';
import AppConfig from './utils/appConfig';
import Logger from './utils/logger';

function App() {
  // File states
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [translatedFileKey, setTranslatedFileKey] = useState(null);
  
  // Translation job states
  const [translationJobId, setTranslationJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Toggle debug panel visibility
  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
    // Also toggle debug mode in the logger
    AppConfig.toggleDebug();
  };
  
  // Language states
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const targetLanguage = 'zh-TW'; // Fixed target language to Traditional Chinese (Taiwan)
  
  // App states
  const [currentStep, setCurrentStep] = useState('upload'); // upload, translating, complete

  // Function to handle file upload completion
  const handleFileUploaded = (fileKey, filename) => {
    setUploadedFileKey(fileKey);
    setOriginalFilename(filename);
    setErrorMessage(null);
    setCurrentStep('uploaded');
  };
  
  // Function to handle errors
  const handleError = (message) => {
    setErrorMessage(message);
  };
  
  // Function to start translation
  const startTranslation = async () => {
    if (!uploadedFileKey || !sourceLanguage || !targetLanguage) {
      setErrorMessage('Missing required information to start translation');
      return;
    }
    
    try {
      setCurrentStep('translating');
      setErrorMessage(null);
      
      console.log(`[${new Date().toISOString()}] Starting translation for file: ${uploadedFileKey}`);
      
      // Request translation from service
      const response = await TranslationService.requestTranslation(
        uploadedFileKey,
        sourceLanguage,
        targetLanguage
      );
      
      console.log(`[${new Date().toISOString()}] Translation request successful, job ID: ${response}`);
      
      // Set job ID to trigger progress tracking
      setTranslationJobId(response);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Translation request failed:`, error);
      setErrorMessage(`Failed to start translation: ${error.message}`);
      setCurrentStep('uploaded'); // Reset to upload state
    }
  };
  
  // Function to handle translation completion
  const handleTranslationComplete = (fileKey) => {
    setTranslatedFileKey(fileKey);
    setCurrentStep('completed');
  };
  
  // Function to handle translation failure
  const handleTranslationFailed = (errorMsg) => {
    setErrorMessage(`Translation failed: ${errorMsg}`);
    setCurrentStep('uploaded'); // Reset to upload state
  };
  
  // Function to reset and start over
  const handleReset = () => {
    setUploadedFileKey(null);
    setOriginalFilename(null);
    setTranslatedFileKey(null);
    setTranslationJobId(null);
    setErrorMessage(null);
    setCurrentStep('upload');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PowerPoint Translation Service</h1>
        <p className="subtitle">Easily translate your PowerPoint presentations between languages</p>
      </header>
      
      <main className="App-main">
        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep === 'upload' || currentStep === 'uploaded' ? 'active' : ''}`}>
            1. Upload File
          </div>
          <div className={`step ${currentStep === 'translating' ? 'active' : ''}`}>
            2. Translation
          </div>
          <div className={`step ${currentStep === 'completed' ? 'active' : ''}`}>
            3. Download
          </div>
        </div>
        
        {/* Error messages */}
        {errorMessage && (
          <div className="error-container">
            <p className="error-message">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)}>Dismiss</button>
          </div>
        )}
        
        {/* File upload section */}
        <section className={`section ${currentStep !== 'upload' ? 'collapsed' : ''}`}>
          <FileUpload
            onFileUploaded={handleFileUploaded}
            onError={handleError}
          />
        </section>
        
        {/* Language selection & translation section */}
        {(currentStep === 'uploaded') && (
          <section className="section">
            <h3>Select Translation Languages</h3>
            <p>Selected file: {originalFilename}</p>
            
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceLanguageChange={setSourceLanguage}
              onTargetLanguageChange={() => {}} // Disabled for fixed target language
            />
            <p className="language-note">Translations are fixed to Traditional Chinese (Taiwan) as per service specification.</p>
            
            <div className="action-buttons">
              <button 
                className="start-button"
                onClick={startTranslation}
              >
                Start Translation
              </button>
            </div>
          </section>
        )}
        
        {/* Translation progress section */}
        {(currentStep === 'translating' && translationJobId) && (
          <section className="section">
            <ProgressTracker
              jobId={translationJobId}
              onTranslationComplete={handleTranslationComplete}
              onTranslationFailed={handleTranslationFailed}
            />
          </section>
        )}
        
        {/* Download section */}
        {(currentStep === 'completed' && translatedFileKey) && (
          <section className="section">
            <h3>Translation Complete!</h3>
            <p>Your translated PowerPoint file is ready.</p>
            
            <DownloadButton
              fileKey={translatedFileKey}
              originalFilename={originalFilename}
            />
            
            <div className="action-buttons">
              <button 
                className="reset-button"
                onClick={handleReset}
              >
                Translate Another File
              </button>
            </div>
          </section>
        )}
      </main>
      
      <footer className="App-footer">
        <p>PowerPoint Translation Service &copy; {new Date().getFullYear()}</p>
        <button 
          className="debug-toggle-button" 
          onClick={toggleDebugPanel}
          title="Toggle Debug Panel"
        >
          {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
        </button>
      </footer>
      
      {/* Debug Panel */}
      <DebugPanel isVisible={showDebugPanel} />
    </div>
  );
}

export default App;
