import React, { useState } from 'react';
import { Recommendation } from '../types';
import { ErrorMessage, StationDetail } from './';
import { useAppSelector } from '../hooks/redux';
import FullRanking from './FullRanking';

interface RecommendationResultProps {
  recommendations: Recommendation[];
  onRestart: () => void;
}

const RecommendationResult: React.FC<RecommendationResultProps> = ({
  recommendations,
  onRestart,
}) => {
  const userProfile = useAppSelector((state) => state.diagnostic.userProfile);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [fullRanking, setFullRanking] = useState<Recommendation[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  const handleShowFullRanking = async () => {
    if (!userProfile) return;
    
    setIsLoadingRanking(true);
    try {
      const response = await fetch('/api/recommendations/full-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: userProfile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch full ranking');
      }

      const data = await response.json();
      if (data.success) {
        setFullRanking(data.data.ranking);
        setShowFullRanking(true);
      }
    } catch (error) {
      console.error('Error fetching full ranking:', error);
    } finally {
      setIsLoadingRanking(false);
    }
  };





  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendation-result empty">
        <ErrorMessage
          title="推薦結果が見つかりません"
          message="診断結果を生成できませんでした。診断をやり直してください。"
          type="warning"
          onRestart={onRestart}
        />
      </div>
    );
  }

  return (
    <div className="recommendation-result">
      <div className="result-header">
        <h2>あなたにおすすめの山手線駅</h2>
      </div>

      <div className="recommendations-list">
        {recommendations.map((recommendation) => (
          <div key={recommendation.station.id} className="recommendation-item">
            <StationDetail 
              station={recommendation.station} 
              rank={recommendation.rank}
              score={recommendation.score}
              userProfile={userProfile}
            />
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button 
          onClick={handleShowFullRanking} 
          disabled={isLoadingRanking}
          className="secondary full-ranking-button"
        >
          {isLoadingRanking ? '読み込み中...' : '全ランキングを確認する'}
        </button>
        <button onClick={onRestart} className="restart-button">
          診断をやり直す
        </button>
      </div>

      {showFullRanking && (
        <FullRanking 
          ranking={fullRanking}
          onClose={() => setShowFullRanking(false)}
        />
      )}
    </div>
  );
};

export default RecommendationResult;