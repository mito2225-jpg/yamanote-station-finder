import React from 'react';
import { Recommendation } from '../types';

interface FullRankingProps {
  ranking: Recommendation[];
  onClose: () => void;
}

const FullRanking: React.FC<FullRankingProps> = ({ ranking, onClose }) => {
  return (
    <div className="full-ranking-overlay">
      <div className="full-ranking-modal">
        <div className="full-ranking-header">
          <h3>全駅ランキング</h3>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>
        
        <div className="full-ranking-content">
          <div className="ranking-list">
            {ranking.map((item) => (
              <div key={item.station.id} className="ranking-item">
                <div className="rank-number">{item.rank}</div>
                <div className="station-info">
                  <div className="station-name">{item.station.name}</div>
                  <div className="station-name-en">{item.station.nameEn}</div>
                </div>
                <div className="compatibility-score">
                  <span className="score-value">{item.score.toFixed(1)}</span>
                  <span className="score-label">適合度</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="full-ranking-footer">
          <button onClick={onClose} className="close-ranking-button">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullRanking;