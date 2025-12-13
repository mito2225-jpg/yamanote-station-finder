import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchQuestions,
  submitAnswer,
  nextQuestion,
  previousQuestion,
  generateRecommendations,
  resetDiagnostic,
} from '../store/slices/diagnosticSlice';
import { QuestionCard, ProgressBar, RecommendationResult, ErrorMessage, LoadingSpinner } from './';

const DiagnosticWizard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    questions,
    currentQuestionIndex,
    recommendations,
    sessionId,
    isLoading,
    error,
    isComplete,
  } = useAppSelector((state) => state.diagnostic);

  useEffect(() => {
    // Load questions when component mounts
    dispatch(fetchQuestions());
  }, [dispatch]);

  const handleAnswerSubmit = async (questionId: string, selectedOption: string) => {
    try {
      // Submit answer to backend
      const result = await dispatch(submitAnswer({ 
        questionId, 
        selectedOption, 
        sessionId: sessionId || undefined 
      })).unwrap();

      // Check if diagnostic is complete (either from backend flag or last question)
      if (result.isComplete || currentQuestionIndex === questions.length - 1) {
        // Generate recommendations using the session
        dispatch(generateRecommendations({ sessionId: result.sessionId }));
      } else {
        // Move to next question
        dispatch(nextQuestion());
      }
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Failed to submit answer:', error);
    }
  };

  const handlePreviousQuestion = () => {
    dispatch(previousQuestion());
  };

  const handleRestart = () => {
    dispatch(resetDiagnostic());
    dispatch(fetchQuestions());
  };

  if (error) {
    return (
      <div className="diagnostic-wizard error">
        <ErrorMessage
          title="診断でエラーが発生しました"
          message={error}
          onRestart={handleRestart}
          onRetry={() => {
            dispatch(fetchQuestions());
          }}
        />
      </div>
    );
  }

  if (isLoading && questions.length === 0) {
    return (
      <div className="diagnostic-wizard loading">
        <LoadingSpinner message="質問を読み込み中..." />
      </div>
    );
  }

  // Show loading state when generating recommendations
  if (isComplete && isLoading && recommendations.length === 0) {
    return (
      <div className="diagnostic-wizard loading">
        <LoadingSpinner message="推薦を生成中..." />
      </div>
    );
  }

  if (isComplete && recommendations.length > 0) {
    return (
      <div className="diagnostic-wizard complete">
        <RecommendationResult
          recommendations={recommendations}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="diagnostic-wizard empty">
        <ErrorMessage
          title="質問が見つかりません"
          message="診断質問を読み込めませんでした。ネットワーク接続を確認してください。"
          type="warning"
          onRetry={() => dispatch(fetchQuestions())}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="diagnostic-wizard">
      <ProgressBar progress={progress} />
      
      <div className="question-container">
        <QuestionCard
          question={currentQuestion}
          onAnswerSubmit={handleAnswerSubmit}
          isLoading={isLoading}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
        />
      </div>

      <div className="navigation">
        {currentQuestionIndex > 0 && (
          <button
            onClick={handlePreviousQuestion}
            className="nav-button previous"
            disabled={isLoading}
          >
            前の質問
          </button>
        )}
        
        <div className="question-counter">
          {currentQuestionIndex + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticWizard;