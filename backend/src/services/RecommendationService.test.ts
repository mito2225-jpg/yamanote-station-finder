import { RecommendationService } from './RecommendationService';
import { UserProfile, Station } from '../types';

describe('RecommendationService', () => {
  let service: RecommendationService;
  
  beforeEach(() => {
    service = new RecommendationService();
  });

  describe('calculateScores', () => {
    it('should calculate scores for all stations', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 4,
          transport: 3,
          commercial: 2,
          culture: 1,
          price: 5
        },
        priorities: ['affordable', 'quiet'],
        answers: []
      };

      const scores = service.calculateScores(userProfile);
      
      // Should have scores for all stations in database
      expect(scores.size).toBe(28);
      
      // All scores should be between 0 and 100
      for (const score of scores.values()) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('should return higher scores for stations matching user preferences', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 5,
          transport: 1,
          commercial: 1,
          culture: 1,
          price: 5
        },
        priorities: ['affordable', 'quiet'],
        answers: []
      };

      const scores = service.calculateScores(userProfile);
      const scoresArray = Array.from(scores.values());
      
      // Should have variation in scores
      const maxScore = Math.max(...scoresArray);
      const minScore = Math.min(...scoresArray);
      expect(maxScore).toBeGreaterThan(minScore);
    });
  });

  describe('generateRecommendations', () => {
    it('should return exactly 3 recommendations', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 3,
          transport: 3,
          commercial: 3,
          culture: 3,
          price: 3
        },
        priorities: ['convenient'],
        answers: []
      };

      const recommendations = service.generateRecommendations(userProfile);
      
      expect(recommendations).toHaveLength(3);
    });

    it('should rank recommendations by score in descending order', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 4,
          transport: 2,
          commercial: 3,
          culture: 1,
          price: 4
        },
        priorities: ['affordable'],
        answers: []
      };

      const recommendations = service.generateRecommendations(userProfile);
      
      // Check that scores are in descending order
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
      }
      
      // Check that ranks are correct
      expect(recommendations[0].rank).toBe(1);
      expect(recommendations[1].rank).toBe(2);
      expect(recommendations[2].rank).toBe(3);
    });

    it('should include explanations for each recommendation', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 3,
          transport: 3,
          commercial: 3,
          culture: 3,
          price: 3
        },
        priorities: ['shopping', 'accessible'],
        answers: []
      };

      const recommendations = service.generateRecommendations(userProfile);
      
      for (const recommendation of recommendations) {
        expect(recommendation.explanation).toBeDefined();
        expect(recommendation.explanation.matchingFeatures).toBeDefined();
        expect(recommendation.explanation.strengths).toBeDefined();
        expect(recommendation.explanation.considerations).toBeDefined();
        expect(Array.isArray(recommendation.explanation.matchingFeatures)).toBe(true);
        expect(Array.isArray(recommendation.explanation.strengths)).toBe(true);
        expect(Array.isArray(recommendation.explanation.considerations)).toBe(true);
      }
    });
  });

  describe('explainRecommendation', () => {
    it('should generate meaningful explanations based on user preferences', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 5,
          transport: 1,
          commercial: 1,
          culture: 1,
          price: 5
        },
        priorities: ['affordable', 'quiet', 'family-friendly'],
        answers: []
      };

      // Get a station to test with
      const recommendations = service.generateRecommendations(userProfile);
      const topRecommendation = recommendations[0];
      
      const explanation = service.explainRecommendation(topRecommendation.station, userProfile);
      
      // Should have some content in the explanation
      const totalExplanationItems = 
        explanation.matchingFeatures.length + 
        explanation.strengths.length + 
        explanation.considerations.length;
      
      expect(totalExplanationItems).toBeGreaterThan(0);
    });

    it('should include station name in strength explanations', () => {
      const userProfile: UserProfile = {
        preferences: {
          housing: 4,
          transport: 4,
          commercial: 4,
          culture: 4,
          price: 2
        },
        priorities: ['shopping', 'entertainment'],
        answers: []
      };

      const recommendations = service.generateRecommendations(userProfile);
      const station = recommendations[0].station;
      
      const explanation = service.explainRecommendation(station, userProfile);
      
      // At least some strengths should mention the station name
      const hasStationNameInStrengths = explanation.strengths.some(strength => 
        strength.includes(station.name)
      );
      
      if (explanation.strengths.length > 0) {
        expect(hasStationNameInStrengths).toBe(true);
      }
    });
  });
});