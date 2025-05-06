import React, { useState } from 'react';
import './App.css';
import AWS from 'aws-sdk';  // Import AWS SDK

function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('en');  // Default language
  const [translatedUrl, setTranslatedUrl] = useState('');

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Simulate upload and progress (in real scenario, integrate with S3)
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    // Generate presigned URL or handle translation logic here
    setProgress(100);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleDownload = () => {
    if (translatedUrl) {
      window.location.href = translatedUrl;
    }
  };

  return (
    <div className="App">
      <h1>PPT Translation App</h1>
      <select onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        {/* Add more languages as needed */}
      </select>
      <input type="file" onChange={handleFileUpload} />
      {progress > 0 && <progress value={progress} max="100"></progress>}
      {progress === 100 && translatedUrl && <button onClick={handleDownload}>Download Translated File</button>}
    </div>
  );
}

export default App;
