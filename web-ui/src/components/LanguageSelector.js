import React from 'react';

const LanguageSelector = ({ sourceLanguage, targetLanguage, onSourceLanguageChange, onTargetLanguageChange }) => {
  // List of supported languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' }
  ];

  return (
    <div className="language-selector-container">
      <div className="language-select-group">
        <label htmlFor="source-language">Source Language:</label>
        <select 
          id="source-language"
          value={sourceLanguage} 
          onChange={(e) => onSourceLanguageChange(e.target.value)}
        >
          {languages.map((lang) => (
            <option key={`source-${lang.code}`} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="language-select-group">
        <label htmlFor="target-language">Target Language:</label>
        <select 
          id="target-language"
          value={targetLanguage} 
          onChange={(e) => onTargetLanguageChange(e.target.value)}
          disabled={!sourceLanguage}
        >
          {languages
            .filter(lang => lang.code !== sourceLanguage) // Cannot translate to the same language
            .map((lang) => (
              <option key={`target-${lang.code}`} value={lang.code}>
                {lang.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;