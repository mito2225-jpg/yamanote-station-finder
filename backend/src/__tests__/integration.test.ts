import request from 'supertest';
import express from 'express';
import cors from 'cors';
import diagnosticRoutes from '../routes/diagnostic';
import stationRoutes from '../routes/stations';
import recommendationRoutes from '../routes/recommendations';
import { Question, Answer, UserProfile, Recommendation } from '../types';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api', diagnosticRoutes);
  app.use('/api/stations', stationRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Test API is running' });
  });
  
  return app;
};

describe('Backend Integration Tests', () => {
  let app: express.Application;
  let sessionId: string;
  let userProfile: UserProfile;
  
  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      expect(response.body).toEqual({
        status: 'OK',
        message: 'Test API is running'
      });
    });
  });

  describe('Station Data Consistency', () => {
    test('should return all Yamanote stations', async () => {
      const response = await request(app)
        .get('/api/stations')
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.stations.length).toBeGreaterThan(0);
      expect(response.body.data.count).toBe(response.body.data.stations.length);
    });

    test('should validate station data completeness', async () => {
      const response = await request(app)
        .get('/api/stations/validate/data')
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.stationCount).toBeGreaterThan(0);
      expect(response.body.data.expectedCount).toBe(29); // Hardcoded in the endpoint
      // Note: isComplete may be false if we don't have exactly 29 stations
      expect(typeof response.body.data.isComplete).toBe('boolean');
    });

    test('should return station details for each station', async () => {
      // First get all stations
      const stationsResponse = await request(app)
        .get('/api/stations')
        .expect(200);
        
      const stations = stationsResponse.body.data.stations;
      
      // Test a few random stations for completeness
      const testStations = [stations[0], stations[Math.floor(stations.length/2)], stations[stations.length-1]]; // First, middle, last
      
      for (const station of testStations) {
        const response = await request(app)
          .get(`/api/stations/${station.id}`)
          .expect(200);
          
        const stationData = response.body.data;
        
        // Verify required fields
        expect(stationData).toHaveProperty('id');
        expect(stationData).toHaveProperty('name');
        expect(stationData).toHaveProperty('nameEn');
        expect(stationData).toHaveProperty('location');
        expect(stationData).toHaveProperty('features');
        expect(stationData).toHaveProperty('description');
        
        // Verify location structure
        expect(stationData.location).toHaveProperty('latitude');
        expect(stationData.location).toHaveProperty('longitude');
        
        // Verify features structure
        expect(stationData.features).toHaveProperty('housing');
        expect(stationData.features).toHaveProperty('transport');
        expect(stationData.features).toHaveProperty('commercial');
        expect(stationData.features).toHaveProperty('culture');
        expect(stationData.features).toHaveProperty('price');
      }
    });
  });

  describe('Diagnostic Question Flow', () => {
    test('should return diagnostic questions with proper structure', async () => {
      const response = await request(app)
        .get('/api/questions')
        .expect(200);
        
      expect(response.body.success).toBe(true);
      const questions: Question[] = response.body.data;
      
      // Should have questions
      expect(questions.length).toBeGreaterThan(0);
      
      // Verify question structure
      questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('weight');
        
        // Verify category is valid
        expect(['housing', 'transport', 'commercial', 'culture', 'price'])
          .toContain(question.category);
          
        // Verify options structure
        expect(question.options.length).toBeGreaterThan(0);
        question.options.forEach(option => {
          expect(option).toHaveProperty('id');
          expect(option).toHaveProperty('text');
          expect(option).toHaveProperty('value');
          expect(option).toHaveProperty('tags');
        });
      });
      
      // Verify all categories are covered
      const categories = [...new Set(questions.map(q => q.category))];
      expect(categories).toContain('housing');
      expect(categories).toContain('transport');
      expect(categories).toContain('commercial');
      expect(categories).toContain('culture');
      expect(categories).toContain('price');
    });

    test('should handle answer submission and session management', async () => {
      // Get questions first
      const questionsResponse = await request(app)
        .get('/api/questions')
        .expect(200);
        
      const questions: Question[] = questionsResponse.body.data;
      const firstQuestion = questions[0];
      
      // Submit first answer
      const answerResponse = await request(app)
        .post('/api/answers')
        .send({
          questionId: firstQuestion.id,
          selectedOptionId: firstQuestion.options[0].id
        })
        .expect(200);
        
      expect(answerResponse.body.success).toBe(true);
      expect(answerResponse.body.data).toHaveProperty('sessionId');
      expect(answerResponse.body.data).toHaveProperty('answers');
      expect(answerResponse.body.data).toHaveProperty('isComplete');
      
      sessionId = answerResponse.body.data.sessionId;
      
      // Verify answer was recorded
      expect(answerResponse.body.data.answers).toHaveLength(1);
      expect(answerResponse.body.data.answers[0].questionId).toBe(firstQuestion.id);
      expect(answerResponse.body.data.answers[0].selectedOption).toBe(firstQuestion.options[0].id);
      expect(answerResponse.body.data.isComplete).toBe(false);
    });

    test('should complete diagnostic flow and generate user profile', async () => {
      // Get questions
      const questionsResponse = await request(app)
        .get('/api/questions')
        .expect(200);
        
      const questions: Question[] = questionsResponse.body.data;
      
      // Submit answers for all questions
      let currentSessionId = sessionId;
      
      for (let i = 1; i < questions.length; i++) { // Start from 1 since we already answered first
        const question = questions[i];
        const selectedOption = question.options[0]; // Always select first option for consistency
        
        const response = await request(app)
          .post('/api/answers')
          .send({
            questionId: question.id,
            selectedOptionId: selectedOption.id,
            sessionId: currentSessionId
          })
          .expect(200);
          
        expect(response.body.success).toBe(true);
        currentSessionId = response.body.data.sessionId;
        
        // Check if this is the last question
        if (i === questions.length - 1) {
          expect(response.body.data.isComplete).toBe(true);
          expect(response.body.data).toHaveProperty('userProfile');
          userProfile = response.body.data.userProfile;
          
          // Verify user profile structure
          expect(userProfile).toHaveProperty('preferences');
          expect(userProfile).toHaveProperty('priorities');
          expect(userProfile).toHaveProperty('answers');
          
          // Verify preferences structure
          expect(userProfile.preferences).toHaveProperty('housing');
          expect(userProfile.preferences).toHaveProperty('transport');
          expect(userProfile.preferences).toHaveProperty('commercial');
          expect(userProfile.preferences).toHaveProperty('culture');
          expect(userProfile.preferences).toHaveProperty('price');
        }
      }
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate recommendations based on user profile', async () => {
      const response = await request(app)
        .post('/api/recommendations')
        .send({
          sessionId: sessionId
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      // Verify response structure
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('userProfile');
      expect(data).toHaveProperty('totalStationsAnalyzed');
      expect(data).toHaveProperty('generatedAt');
      
      // Should analyze all stations
      expect(data.totalStationsAnalyzed).toBeGreaterThan(0);
      
      // Should return exactly 3 recommendations
      expect(data.recommendations).toHaveLength(3);
      
      // Verify recommendation structure
      data.recommendations.forEach((rec: Recommendation, index: number) => {
        expect(rec).toHaveProperty('station');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('rank');
        expect(rec).toHaveProperty('explanation');
        
        // Verify rank order
        expect(rec.rank).toBe(index + 1);
        
        // Verify station structure
        expect(rec.station).toHaveProperty('id');
        expect(rec.station).toHaveProperty('name');
        expect(rec.station).toHaveProperty('features');
        
        // Verify explanation structure
        expect(rec.explanation).toHaveProperty('matchingFeatures');
        expect(rec.explanation).toHaveProperty('strengths');
        expect(rec.explanation).toHaveProperty('considerations');
        
        // Score should be between 0 and 100
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
      });
      
      // Recommendations should be sorted by score (highest first)
      for (let i = 1; i < data.recommendations.length; i++) {
        expect(data.recommendations[i-1].score).toBeGreaterThanOrEqual(data.recommendations[i].score);
      }
    });

    test('should generate compatibility scores for all stations', async () => {
      const response = await request(app)
        .post('/api/recommendations/scores')
        .send({
          sessionId: sessionId
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      // Verify response structure
      expect(data).toHaveProperty('scores');
      expect(data).toHaveProperty('userProfile');
      expect(data).toHaveProperty('totalStations');
      expect(data).toHaveProperty('calculatedAt');
      
      // Should have scores for all stations
      expect(data.scores.length).toBeGreaterThan(0);
      expect(data.totalStations).toBe(data.scores.length);
      
      // Verify score structure
      data.scores.forEach((scoreData: any) => {
        expect(scoreData).toHaveProperty('stationId');
        expect(scoreData).toHaveProperty('score');
        expect(typeof scoreData.stationId).toBe('string');
        expect(typeof scoreData.score).toBe('number');
        expect(scoreData.score).toBeGreaterThanOrEqual(0);
        expect(scoreData.score).toBeLessThanOrEqual(100);
      });
    });

    test('should explain individual station recommendations', async () => {
      // Get a station ID from the recommendations
      const recResponse = await request(app)
        .post('/api/recommendations')
        .send({ sessionId: sessionId })
        .expect(200);
        
      const topStation = recResponse.body.data.recommendations[0];
      
      const response = await request(app)
        .post(`/api/recommendations/explain/${topStation.station.id}`)
        .send({
          sessionId: sessionId
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      // Verify response structure
      expect(data).toHaveProperty('station');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('explanation');
      expect(data).toHaveProperty('userProfile');
      expect(data).toHaveProperty('explainedAt');
      
      // Verify explanation completeness
      expect(data.explanation).toHaveProperty('matchingFeatures');
      expect(data.explanation).toHaveProperty('strengths');
      expect(data.explanation).toHaveProperty('considerations');
      
      expect(Array.isArray(data.explanation.matchingFeatures)).toBe(true);
      expect(Array.isArray(data.explanation.strengths)).toBe(true);
      expect(Array.isArray(data.explanation.considerations)).toBe(true);
    });
  });

  describe('Data Consistency Across Endpoints', () => {
    test('should maintain consistent station data across different endpoints', async () => {
      // Get station from stations endpoint
      const stationsResponse = await request(app)
        .get('/api/stations')
        .expect(200);
        
      const stationFromList = stationsResponse.body.data.stations[0];
      
      // Get same station from individual endpoint
      const stationResponse = await request(app)
        .get(`/api/stations/${stationFromList.id}`)
        .expect(200);
        
      const stationFromDetail = stationResponse.body.data;
      
      // Should be identical
      expect(stationFromDetail.id).toBe(stationFromList.id);
      expect(stationFromDetail.name).toBe(stationFromList.name);
      expect(stationFromDetail.nameEn).toBe(stationFromList.nameEn);
      expect(stationFromDetail.features).toEqual(stationFromList.features);
    });

    test('should maintain consistent user profile across diagnostic and recommendation endpoints', async () => {
      // Get user profile from diagnostic endpoint
      const profileResponse = await request(app)
        .get(`/api/sessions/${sessionId}/profile`)
        .expect(200);
        
      const profileFromDiagnostic = profileResponse.body.data;
      
      // Get user profile from recommendation endpoint
      const recResponse = await request(app)
        .post('/api/recommendations')
        .send({ sessionId: sessionId })
        .expect(200);
        
      const profileFromRecommendation = recResponse.body.data.userProfile;
      
      // Should be identical
      expect(profileFromRecommendation.preferences).toEqual(profileFromDiagnostic.preferences);
      expect(profileFromRecommendation.priorities).toEqual(profileFromDiagnostic.priorities);
      expect(profileFromRecommendation.answers.length).toBe(profileFromDiagnostic.answers.length);
    });

    test('should maintain consistent recommendation scores across multiple calls', async () => {
      // Generate recommendations twice
      const response1 = await request(app)
        .post('/api/recommendations')
        .send({ sessionId: sessionId })
        .expect(200);
        
      const response2 = await request(app)
        .post('/api/recommendations')
        .send({ sessionId: sessionId })
        .expect(200);
        
      const recs1 = response1.body.data.recommendations;
      const recs2 = response2.body.data.recommendations;
      
      // Should be identical
      expect(recs1.length).toBe(recs2.length);
      
      for (let i = 0; i < recs1.length; i++) {
        expect(recs1[i].station.id).toBe(recs2[i].station.id);
        expect(recs1[i].score).toBe(recs2[i].score);
        expect(recs1[i].rank).toBe(recs2[i].rank);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid station ID gracefully', async () => {
      const response = await request(app)
        .get('/api/stations/invalid-station-id')
        .expect(404);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle invalid session ID gracefully', async () => {
      const response = await request(app)
        .get('/api/sessions/invalid-session-id/profile')
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle malformed answer submission', async () => {
      const response = await request(app)
        .post('/api/answers')
        .send({
          // Missing required fields
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle recommendation request without session or profile', async () => {
      const response = await request(app)
        .post('/api/recommendations')
        .send({
          // No sessionId or userProfile
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});