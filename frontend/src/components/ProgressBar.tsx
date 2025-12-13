

interface ProgressBarProps {
  progress: number; // Progress percentage (0-100)
  showPercentage?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  className = '',
}) => {
  // Ensure progress is within valid range
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  // Calculate display values
  const progressPercentage = Math.round(normalizedProgress);
  const progressWidth = `${normalizedProgress}%`;

  return (
    <div className={`progress-bar-container ${className}`}>
      <div className="progress-bar-header">
        <span className="progress-label">診断の進捗</span>
        {showPercentage && (
          <span className="progress-percentage">{progressPercentage}%</span>
        )}
      </div>
      
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: progressWidth }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`診断の進捗: ${progressPercentage}%`}
        >
          <div className="progress-bar-shine" />
        </div>
      </div>
      
      <div className="progress-steps">
        {Array.from({ length: 5 }, (_, index) => {
          const stepProgress = ((index + 1) / 5) * 100;
          const isCompleted = normalizedProgress >= stepProgress;
          const isCurrent = normalizedProgress >= stepProgress - 20 && normalizedProgress < stepProgress;
          
          return (
            <div
              key={index}
              className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="step-marker" />
              <div className="step-label">
                {index === 0 && <span className="step-icon">🏠</span>}
                {index === 1 && <span className="step-icon">🚃</span>}
                {index === 2 && <span className="step-icon">🛍️</span>}
                {index === 3 && <span className="step-icon">🎭</span>}
                {index === 4 && <span className="step-icon">💰</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;