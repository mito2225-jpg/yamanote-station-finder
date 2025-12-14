import { Router, Request, Response } from 'express';
import { recommendationService } from '../services/RecommendationService';
import { diagnosticService } from '../services/DiagnosticService';
import { stationService } from '../services/StationService';
import { UserProfile } from '../types';

const router = Router();

/**
 * POST /api/recommendations
 * Generate station recommendations based on user profile
 * Body: { sessionId?: string, userProfile?: UserProfile }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { sessionId, userProfile } = req.body;
    
    let profile: UserProfile;
    
    // Get user profile from session or use provided profile
    if (sessionId) {
      try {
        profile = diagnosticService.getUserProfile(sessionId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: `Session '${sessionId}' not found or incomplete`
        });
      }
    } else if (userProfile) {
      profile = userProfile;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required data',
        message: 'Either sessionId or userProfile must be provided'
      });
    }

    // Validate user profile structure
    if (!profile.preferences || !profile.priorities || !profile.answers) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user profile',
        message: 'User profile must contain preferences, priorities, and answers'
      });
    }

    // Generate recommendations
    const recommendations = recommendationService.generateRecommendations(profile);
    
    // Calculate scores for all stations (for additional analysis)
    const allScores = recommendationService.calculateScores(profile);
    
    res.json({
      success: true,
      data: {
        recommendations,
        userProfile: profile,
        totalStationsAnalyzed: allScores.size,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/recommendations/full-ranking
 * Get full ranking of all stations based on user profile
 * Body: { sessionId?: string, userProfile?: UserProfile }
 */
router.post('/full-ranking', (req: Request, res: Response) => {
  try {
    const { sessionId, userProfile } = req.body;
    
    let profile: UserProfile;
    
    // Get user profile from session or use provided profile
    if (sessionId) {
      try {
        profile = diagnosticService.getUserProfile(sessionId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: `Session '${sessionId}' not found or incomplete`
        });
      }
    } else if (userProfile) {
      profile = userProfile;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required data',
        message: 'Either sessionId or userProfile must be provided'
      });
    }

    // Generate full ranking
    const fullRanking = recommendationService.generateFullRanking(profile);
    
    res.json({
      success: true,
      data: {
        ranking: fullRanking,
        userProfile: profile,
        totalStations: fullRanking.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate full ranking',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/recommendations/scores
 * Get compatibility scores for all stations based on user profile
 * Body: { sessionId?: string, userProfile?: UserProfile }
 */
router.post('/scores', (req: Request, res: Response) => {
  try {
    const { sessionId, userProfile } = req.body;
    
    let profile: UserProfile;
    
    // Get user profile from session or use provided profile
    if (sessionId) {
      try {
        profile = diagnosticService.getUserProfile(sessionId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: `Session '${sessionId}' not found or incomplete`
        });
      }
    } else if (userProfile) {
      profile = userProfile;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required data',
        message: 'Either sessionId or userProfile must be provided'
      });
    }

    // Calculate scores for all stations
    const scoresMap = recommendationService.calculateScores(profile);
    
    // Convert Map to array of objects for JSON response
    const scores = Array.from(scoresMap.entries()).map(([stationId, score]) => ({
      stationId,
      score: Math.round(score * 100) / 100 // Round to 2 decimal places
    })).sort((a, b) => b.score - a.score); // Sort by score descending

    res.json({
      success: true,
      data: {
        scores,
        userProfile: profile,
        totalStations: scores.length,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/recommendations/explain/:stationId
 * Get detailed explanation for why a specific station was recommended
 * Body: { sessionId?: string, userProfile?: UserProfile }
 */
router.post('/explain/:stationId', (req: Request, res: Response) => {
  try {
    const { stationId } = req.params;
    const { sessionId, userProfile } = req.body;
    
    let profile: UserProfile;
    
    // Get user profile from session or use provided profile
    if (sessionId) {
      try {
        profile = diagnosticService.getUserProfile(sessionId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: `Session '${sessionId}' not found or incomplete`
        });
      }
    } else if (userProfile) {
      profile = userProfile;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing required data',
        message: 'Either sessionId or userProfile must be provided'
      });
    }

    // Get station information
    const station = stationService.getStationById(stationId);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found',
        message: `Station with ID '${stationId}' does not exist`
      });
    }

    // Generate explanation
    const explanation = recommendationService.explainRecommendation(station, profile);
    
    // Calculate score for this specific station
    const allScores = recommendationService.calculateScores(profile);
    const score = allScores.get(stationId) || 0;

    res.json({
      success: true,
      data: {
        station,
        score: Math.round(score * 100) / 100,
        explanation,
        userProfile: profile,
        explainedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;