import { useState } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswerSubmit: (questionId: string, selectedOption: string) => void;
  isLoading?: boolean;
  isLastQuestion?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswerSubmit,
  isLoading = false,
  isLastQuestion = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setValidationError('');
  };

  const handleSubmit = () => {
    // Validate single selection
    if (!selectedOption) {
      setValidationError('選択肢を選んでください');
      return;
    }

    // Validate that the selected option exists
    const isValidOption = question.options.some(option => option.id === selectedOption);
    if (!isValidOption) {
      setValidationError('無効な選択肢です');
      return;
    }

    // Submit the answer
    onAnswerSubmit(question.id, selectedOption);
    setSelectedOption('');
    setValidationError('');
  };

  const getCategoryLabel = (category: string): string => {
    const categoryLabels = {
      housing: '住環境',
      transport: '交通利便性',
      commercial: '商業施設',
      culture: '文化・娯楽',
      price: '価格帯',
      priority: '優先項目',
    };
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const getCategoryIcon = (category: string): string => {
    const categoryIcons = {
      housing: '🏠',
      transport: '🚃',
      commercial: '🛍️',
      culture: '🎭',
      price: '💰',
      priority: '⭐',
    };
    return categoryIcons[category as keyof typeof categoryIcons] || '📋';
  };

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="category-badge">
          <span className="category-icon">{getCategoryIcon(question.category)}</span>
          {getCategoryLabel(question.category)}
        </span>
      </div>

      <div className="question-content">
        <h2 className="question-text">{question.text}</h2>

        <div className="options-container">
          {question.options.map((option) => (
            <div
              key={option.id}
              className={`option ${selectedOption === option.id ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <input
                type="radio"
                id={option.id}
                name={`question-${question.id}`}
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => handleOptionSelect(option.id)}
                disabled={isLoading}
              />
              <label htmlFor={option.id} className="option-label">
                {option.text}
              </label>
            </div>
          ))}
        </div>

        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}

        <div className="question-actions">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || isLoading}
            className="submit-button"
          >
            {isLoading ? '送信中...' : (isLastQuestion ? '結果を見る' : '次へ')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;