
import React from 'react';
import { Station, UserProfile } from '../types';

interface StationDetailProps {
  station: Station;
  className?: string;
  rank?: number;
  score?: number;
  userProfile?: UserProfile | null;
}

const StationDetail: React.FC<StationDetailProps> = ({
  station,
  className = '',
  rank,
  score,
  userProfile,
}) => {
  const getFeatureLevel = (value: number): string => {
    if (value >= 3.5) return 'high';
    if (value >= 2.5) return 'medium';
    return 'low';
  };



  // 各項目に対応する質問IDと重みのマッピング
  const getDetailedPreference = (featureKey: string, userProfile: UserProfile): number => {
    if (!userProfile.answers) return userProfile.preferences.housing; // フォールバック
    
    // 各項目と質問の対応関係
    const featureQuestionMapping: Record<string, { questionIds: string[], weights: number[], defaultCategory: keyof UserProfile['preferences'] }> = {
      // 住環境
      'rentLevel': { 
        questionIds: ['housing_03'], 
        weights: [1.0], 
        defaultCategory: 'housing' 
      },
      'familyFriendly': { 
        questionIds: ['housing_02'], 
        weights: [1.0], 
        defaultCategory: 'housing' 
      },
      'quietness': { 
        questionIds: ['housing_01'], 
        weights: [1.0], 
        defaultCategory: 'housing' 
      },
      
      // 交通利便性
      'accessibility': { 
        questionIds: ['transport_01', 'transport_03'], 
        weights: [0.7, 0.3], 
        defaultCategory: 'transport' 
      },

      
      // 商業施設
      'shopping': { 
        questionIds: ['commercial_01'], 
        weights: [1.0], 
        defaultCategory: 'commercial' 
      },
      'restaurants': { 
        questionIds: ['commercial_02'], 
        weights: [1.0], 
        defaultCategory: 'commercial' 
      },
      'convenience': { 
        questionIds: ['commercial_03'], 
        weights: [1.0], 
        defaultCategory: 'commercial' 
      },
      
      // 文化・娯楽
      'entertainment': { 
        questionIds: ['culture_01'], 
        weights: [1.0], 
        defaultCategory: 'culture' 
      },
      'history': { 
        questionIds: ['culture_02'], 
        weights: [1.0], 
        defaultCategory: 'culture' 
      },
      'nightlife': { 
        questionIds: ['culture_03'], 
        weights: [1.0], 
        defaultCategory: 'culture' 
      },
      
      // 価格帯
      'costOfLiving': { 
        questionIds: ['price_01'], 
        weights: [1.0], 
        defaultCategory: 'price' 
      },
      'diningCost': { 
        questionIds: ['price_02'], 
        weights: [1.0], 
        defaultCategory: 'price' 
      }
    };
    
    const mapping = featureQuestionMapping[featureKey];
    if (!mapping) {
      return userProfile.preferences.housing; // フォールバック
    }
    
    // 対応する質問の回答から指向値を計算
    let totalScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < mapping.questionIds.length; i++) {
      const questionId = mapping.questionIds[i];
      const weight = mapping.weights[i];
      
      const answer = userProfile.answers.find(a => a.questionId === questionId);
      if (answer) {
        // 回答のオプションIDから値を推定（簡易的な実装）
        // 実際の値は質問データから取得すべきですが、ここでは簡易的に推定
        let optionValue = 3; // デフォルト値
        
        if (answer.selectedOption.endsWith('_a')) {
          optionValue = featureKey === 'rentLevel' ? 1 : 5; // 家賃レベルは逆転
        } else if (answer.selectedOption.endsWith('_b')) {
          optionValue = 3;
        } else if (answer.selectedOption.endsWith('_c')) {
          optionValue = featureKey === 'rentLevel' ? 5 : 1; // 家賃レベルは逆転
        }
        
        totalScore += optionValue * weight;
        totalWeight += weight;
      }
    }
    
    if (totalWeight > 0) {
      return totalScore / totalWeight;
    }
    
    // フォールバック：カテゴリ全体の指向値を使用
    return userProfile.preferences[mapping.defaultCategory];
  };

  const renderPositionStar = (userPreference: number, category?: keyof UserProfile['preferences']): JSX.Element => {
    // 価格カテゴリは逆転表示（高いコスパ重視度 = 左側に表示）
    const adjustedValue = category === 'price' ? 6 - userPreference : userPreference;
    
    // ユーザーの指向値を0-100%の位置に変換
    // 値の範囲を1-5から0-1に正規化し、それを0-100%に変換
    const normalizedValue = Math.max(0, Math.min(1, (adjustedValue - 1) / 4));
    const position = normalizedValue * 100;
    
    return (
      <div 
        className="user-position-star" 
        style={{ left: `${position}%` }}
        title={`★ あなたの指向位置 (${userPreference.toFixed(1)})`}
      >
        <div className="star-container">
          <span className="star position-star">★</span>
          <div className="star-pulse"></div>
        </div>
      </div>
    );
  };

  const getLineColor = (lineName: string): string => {
    const lineColors: Record<string, string> = {
      // JR線（正確な公式カラー）
      'JR中央線': '#F15A22',           // オレンジ
      'JR埼京線': '#00AC9A',           // エメラルドグリーン
      'JR常磐線': '#00B261',           // 緑
      'JR総武線': '#FFD400',           // 黄色
      'JR高崎線': '#FF6600',           // オレンジ
      'JR東海道線': '#FF6600',         // オレンジ
      'JR京浜東北線': '#00B2E5',       // 水色
      'JR湘南新宿ライン': '#E31F26',   // 赤（湘南新宿ライン）
      
      // 東京メトロ（正確な公式カラー）
      '東京メトロ銀座線': '#FF9500',   // オレンジ
      '東京メトロ丸ノ内線': '#E60012', // 赤
      '東京メトロ日比谷線': '#B5B5AC', // シルバー
      '東京メトロ東西線': '#009BBF',   // 水色
      '東京メトロ千代田線': '#00BB85', // 緑
      '東京メトロ有楽町線': '#C1A470', // ゴールド
      '東京メトロ半蔵門線': '#8F76D6', // 紫
      '東京メトロ南北線': '#00AC9A',   // エメラルド
      '東京メトロ副都心線': '#9C5F2A', // 茶色
      '東京メトロ新宿線': '#6CBB5A',   // 緑（都営新宿線と同色）
      
      // 都営地下鉄（正確な公式カラー）
      '都営浅草線': '#EB6EA0',         // ピンク
      '都営三田線': '#0079C2',         // 青
      '都営新宿線': '#6CBB5A',         // 緑
      '都営大江戸線': '#B6007A',       // マゼンタ
      
      // 私鉄（正確な公式カラー）
      '東急東横線': '#DA020E',         // 赤
      '東急田園都市線': '#009639',     // 緑
      '東急目黒線': '#00AC9A',         // エメラルド
      '東急池上線': '#EE86A1',         // ピンク
      '京王線': '#DD0077',             // ピンク
      '京王井の頭線': '#00B48D',       // エメラルド
      '小田急線': '#0066CC',           // 青
      '西武池袋線': '#176FC1',         // 青
      '西武新宿線': '#F15A22',         // オレンジ
      '東武東上線': '#004B87',         // 紺
      '京急本線': '#C1272D',           // 赤
      '京成本線': '#3165B2',           // 青
      'りんかい線': '#00B5AD',         // 水色
    };
    
    return lineColors[lineName] || '#666666';
  };

  const getTextColor = (backgroundColor: string): string => {
    // 背景色から明度を計算して、適切な文字色を決定
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 相対輝度を計算 (WCAG基準)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // 明度が0.5以上なら黒文字、未満なら白文字
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const getBarLabels = (featureKey: string): { left: string, right: string } => {
    const labelMapping: Record<string, { left: string, right: string }> = {
      // 住環境
      'rentLevel': { left: '安', right: '高' },
      'familyFriendly': { left: '低', right: '高' },
      'quietness': { left: '騒', right: '静' },
      
      // 交通利便性
      'accessibility': { left: '低', right: '高' },

      
      // 商業施設
      'shopping': { left: '少', right: '多' },
      'restaurants': { left: '少', right: '多' },
      'convenience': { left: '低', right: '高' },
      
      // 文化・娯楽
      'entertainment': { left: '少', right: '多' },
      'history': { left: '少', right: '多' },
      'nightlife': { left: '少', right: '多' },
      
      // 価格帯
      'costOfLiving': { left: '安', right: '高' },
      'diningCost': { left: '安', right: '高' }
    };
    
    return labelMapping[featureKey] || { left: '低', right: '高' };
  };

  const renderFeatureBar = (label: string, value: number, category?: keyof UserProfile['preferences'], featureKey?: string, maxValue: number = 5) => {
    const percentage = (value / maxValue) * 100;
    const levelClass = getFeatureLevel(value);
    const barLabels = featureKey ? getBarLabels(featureKey) : { left: '低', right: '高' };
    
    return (
      <div className="feature-item">
        <div className="feature-label">
          <span>{label}</span>
        </div>
        <div className="feature-bar-container">
          <div className="feature-bar-with-labels">
            <span className="bar-label left">{barLabels.left}</span>
            <div className="feature-bar">
              <div
                className={`feature-fill ${levelClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="bar-label right">{barLabels.right}</span>
          </div>
          {userProfile && category && featureKey && (
            <div className="user-stars-overlay">
              {renderPositionStar(getDetailedPreference(featureKey, userProfile), category)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`station-detail ${className}`}>
      <div className="station-header">
        <div className="station-title-row">
          {rank && (
            <div className="rank-badge-detail">
              {rank}位
            </div>
          )}
          <h3 className="station-name">
            {station.name}
            <span className="station-name-en">{station.nameEn}</span>
          </h3>
          {score && (
            <div className={`score-badge ${score >= 80 ? 'high-score' : score >= 60 ? 'medium-score' : 'low-score'}`}>
              適合度: {Math.round(score)}%
            </div>
          )}
        </div>
        {station.rentPrices && rank && rank <= 3 && (
          <div className="rent-prices-inline">
            平均家賃: 1K {station.rentPrices.oneK}万円 | 1LDK {station.rentPrices.oneLDK}万円 | 2LDK {station.rentPrices.twoLDK}万円 | 3LDK {station.rentPrices.threeLDK}万円
          </div>
        )}
      </div>

      <div className="station-description">
        <p>{station.description}</p>
      </div>

      {userProfile && rank === 1 && (
        <div className="user-guide">
          <p><span className="guide-star">★</span> 星マークはあなたの指向位置を表しています</p>
        </div>
      )}

      <div className="station-features">
        <div className="feature-category">
          <h4><span className="category-icon">🏠</span>住環境</h4>
          <div className="feature-group">
            {renderFeatureBar('ファミリー向け', station.features.housing.familyFriendly, 'housing', 'familyFriendly')}
            {renderFeatureBar('静かさ', station.features.housing.quietness, 'housing', 'quietness')}
          </div>
        </div>

        <div className="feature-category">
          <h4><span className="category-icon">🚃</span>交通利便性</h4>
          <div className="feature-group">
            {renderFeatureBar('アクセス性', station.features.transport.accessibility, 'transport', 'accessibility')}
            <div className="connections">
              <span className="connections-label">乗り換え路線:</span>
              <div className="connections-list">
                {station.features.transport.connections.map((connection, index) => {
                  const backgroundColor = getLineColor(connection);
                  const textColor = getTextColor(backgroundColor);
                  return (
                    <span 
                      key={index} 
                      className="connection-badge"
                      style={{ 
                        backgroundColor: backgroundColor,
                        color: textColor,
                        textShadow: textColor === '#ffffff' ? '0 1px 1px rgba(0, 0, 0, 0.3)' : '0 1px 1px rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {connection}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="feature-category">
          <h4><span className="category-icon">🛍️</span>商業施設</h4>
          <div className="feature-group">
            {renderFeatureBar('ショッピング', station.features.commercial.shopping, 'commercial', 'shopping')}
            {renderFeatureBar('レストラン', station.features.commercial.restaurants, 'commercial', 'restaurants')}
            {renderFeatureBar('利便性', station.features.commercial.convenience, 'commercial', 'convenience')}
          </div>
        </div>

        <div className="feature-category">
          <h4><span className="category-icon">🎭</span>文化・娯楽</h4>
          <div className="feature-group">
            {renderFeatureBar('エンターテイメント', station.features.culture.entertainment, 'culture', 'entertainment')}
            {renderFeatureBar('歴史・文化', station.features.culture.history, 'culture', 'history')}
            {renderFeatureBar('ナイトライフ', station.features.culture.nightlife, 'culture', 'nightlife')}
          </div>
        </div>

        <div className="feature-category">
          <h4><span className="category-icon">💰</span>価格帯</h4>
          <div className="feature-group">
            {renderFeatureBar('家賃レベル', station.features.housing.rentLevel, 'housing', 'rentLevel')}
            {renderFeatureBar('生活コスト', station.features.price.costOfLiving, 'price', 'costOfLiving')}
            {renderFeatureBar('外食コスト', station.features.price.diningCost, 'price', 'diningCost')}
          </div>
        </div>


      </div>
    </div>
  );
};

export default StationDetail;