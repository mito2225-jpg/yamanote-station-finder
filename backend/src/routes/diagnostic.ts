import { Router, Request, Response } from 'express';
import { diagnosticService } from '../services/DiagnosticService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/questions
 * Get all diagnostic questions
 */
router.get('/questions', (req: Request, res: Response) => {
  try {
    const questions = diagnosticService.getQuestions();
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/answers
 * Submit an answer for a diagnostic question
 * Body: { sessionId?: string, questionId: string, selectedOptionId: string }
 */
router.post('/answers', (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, selectedOptionId } = req.body;

    // Validate required fields
    if (!questionId || !selectedOptionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'questionId and selectedOptionId are required'
      });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();

    // Submit the answer
    const answers = diagnosticService.submitAnswer(currentSessionId, questionId, selectedOptionId);
    
    // Check if diagnostic is complete
    const isComplete = diagnosticService.isDiagnosticComplete(currentSessionId);
    
    // Get user profile if complete
    let userProfile = null;
    if (isComplete) {
      userProfile = diagnosticService.getUserProfile(currentSessionId);
    }

    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        answers,
        isComplete,
        userProfile
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to submit answer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sessions/:sessionId/answers
 * Get all answers for a specific session
 */
router.get('/sessions/:sessionId/answers', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const answers = diagnosticService.getAnswers(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        answers,
        isComplete: diagnosticService.isDiagnosticComplete(sessionId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session answers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sessions/:sessionId/profile
 * Get user profile for a specific session
 */
router.get('/sessions/:sessionId/profile', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userProfile = diagnosticService.getUserProfile(sessionId);
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to retrieve user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Clear session data
 */
router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    diagnosticService.clearSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;