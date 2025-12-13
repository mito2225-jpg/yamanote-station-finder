import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onRestart?: () => void;
  showDetails?: boolean;
  details?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'エラーが発生しました',
  message,
  type = 'error',
  onRetry,
  onRestart,
  showDetails = false,
  details,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-message ${type}`}>
      <div className="error-icon">
        {getIcon()}
      </div>
      
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-text">{message}</p>
        
        {showDetails && details && (
          <details className="error-details">
            <summary>詳細情報</summary>
            <pre className="error-details-text">{details}</pre>
          </details>
        )}
      </div>

      <div className="error-actions">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button primary"
          >
            再試行
          </button>
        )}
        
        {onRestart && (
          <button 
            onClick={onRestart}
            className="restart-button secondary"
          >
            最初からやり直す
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;