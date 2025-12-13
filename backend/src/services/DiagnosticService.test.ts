import { DiagnosticService } from './DiagnosticService';
import { Question, QuestionCategory } from '../types';
import * as fc from 'fast-check';

describe('DiagnosticService', () => {
  let service: DiagnosticService;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    service = new DiagnosticService();
  });

  afterEach(() => {
    service.clearSession(testSessionId);
  });

  describe('getQuestions', () => {
    it('should return all questions', () => {
      const questions = service.getQuestions();
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return questions with all required properties', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      
      expect(firstQuestion).toHaveProperty('id');
      expect(firstQuestion).toHaveProperty('category');
      expect(firstQuestion).toHaveProperty('text');
      expect(firstQuestion).toHaveProperty('options');
      expect(firstQuestion).toHaveProperty('weight');
      expect(Array.isArray(firstQuestion.options)).toBe(true);
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions filtered by category', () => {
      const housingQuestions = service.getQuestionsByCategory('housing');
      expect(housingQuestions.every(q => q.category === 'housing')).toBe(true);
      expect(housingQuestions.length).toBeGreaterThan(0);
    });

    it('should return questions for all categories', () => {
      const categories: QuestionCategory[] = ['housing', 'transport', 'commercial', 'culture', 'price'];
      
      for (const category of categories) {
        const questions = service.getQuestionsByCategory(category);
        expect(questions.length).toBeGreaterThan(0);
        expect(questions.every(q => q.category === category)).toBe(true);
      }
    });
  });

  describe('submitAnswer', () => {
    it('should record a valid answer', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const firstOption = firstQuestion.options[0];

      const answers = service.submitAnswer(testSessionId, firstQuestion.id, firstOption.id);
      
      expect(answers).toBeDefined();
      expect(answers.length).toBe(1);
      expect(answers[0].questionId).toBe(firstQuestion.id);
      expect(answers[0].selectedOption).toBe(firstOption.id);
      expect(answers[0].timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for invalid question id', () => {
      expect(() => {
        service.submitAnswer(testSessionId, 'invalid-question', 'some-option');
      }).toThrow('Question with id invalid-question not found');
    });

    it('should throw error for invalid option id', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];

      expect(() => {
        service.submitAnswer(testSessionId, firstQuestion.id, 'invalid-option');
      }).toThrow(`Option with id invalid-option not found for question ${firstQuestion.id}`);
    });

    it('should replace existing answer for the same question', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const firstOption = firstQuestion.options[0];
      const secondOption = firstQuestion.options[1];

      // Submit first answer
      service.submitAnswer(testSessionId, firstQuestion.id, firstOption.id);
      
      // Submit second answer for same question
      const answers = service.submitAnswer(testSessionId, firstQuestion.id, secondOption.id);
      
      expect(answers.length).toBe(1);
      expect(answers[0].selectedOption).toBe(secondOption.id);
    });
  });

  describe('getUserProfile', () => {
    it('should generate user profile from answers', () => {
      const questions = service.getQuestions();
      
      // Answer a few questions
      for (let i = 0; i < 3; i++) {
        const question = questions[i];
        const option = question.options[0];
        service.submitAnswer(testSessionId, question.id, option.id);
      }

      const profile = service.getUserProfile(testSessionId);
      
      expect(profile).toBeDefined();
      expect(profile).toHaveProperty('preferences');
      expect(profile).toHaveProperty('priorities');
      expect(profile).toHaveProperty('answers');
      expect(profile.answers.length).toBe(3);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        service.getUserProfile('non-existent-session');
      }).toThrow('Session non-existent-session not found');
    });

    it('should calculate preferences correctly', () => {
      const questions = service.getQuestions();
      const housingQuestion = questions.find(q => q.category === 'housing');
      
      if (housingQuestion) {
        const option = housingQuestion.options[0];
        service.submitAnswer(testSessionId, housingQuestion.id, option.id);
        
        const profile = service.getUserProfile(testSessionId);
        expect(typeof profile.preferences.housing).toBe('number');
        expect(profile.preferences.housing).toBeGreaterThan(0);
      }
    });

    it('should return cached profile on subsequent calls', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const option = firstQuestion.options[0];
      
      service.submitAnswer(testSessionId, firstQuestion.id, option.id);
      
      const profile1 = service.getUserProfile(testSessionId);
      const profile2 = service.getUserProfile(testSessionId);
      
      expect(profile1).toBe(profile2); // Should be the same object reference
    });
  });

  describe('isDiagnosticComplete', () => {
    it('should return false for incomplete diagnostic', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const option = firstQuestion.options[0];
      
      service.submitAnswer(testSessionId, firstQuestion.id, option.id);
      
      expect(service.isDiagnosticComplete(testSessionId)).toBe(false);
    });

    it('should return false for non-existent session', () => {
      expect(service.isDiagnosticComplete('non-existent')).toBe(false);
    });
  });

  describe('getAnswers', () => {
    it('should return answers for existing session', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const option = firstQuestion.options[0];
      
      service.submitAnswer(testSessionId, firstQuestion.id, option.id);
      
      const answers = service.getAnswers(testSessionId);
      expect(answers.length).toBe(1);
      expect(answers[0].questionId).toBe(firstQuestion.id);
    });

    it('should return empty array for non-existent session', () => {
      const answers = service.getAnswers('non-existent');
      expect(answers).toEqual([]);
    });
  });

  describe('clearSession', () => {
    it('should clear session data', () => {
      const questions = service.getQuestions();
      const firstQuestion = questions[0];
      const option = firstQuestion.options[0];
      
      service.submitAnswer(testSessionId, firstQuestion.id, option.id);
      expect(service.getAnswers(testSessionId).length).toBe(1);
      
      service.clearSession(testSessionId);
      expect(service.getAnswers(testSessionId).length).toBe(0);
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 1: Answer recording and progression', () => {
      /**
       * **Feature: yamanote-station-finder, Property 1: Answer recording and progression**
       * For any diagnostic question and valid answer, submitting the answer should record it 
       * in the user profile and advance to the next question in the sequence
       * **Validates: Requirements 1.2**
       */
      it('should record answers and enable progression for any valid question-answer pair', () => {
        fc.assert(fc.property(
          fc.constantFrom(...service.getQuestions()),
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `session-${s}`),
          (question, sessionId) => {
            // Clean up any existing session
            service.clearSession(sessionId);
            
            // Select a random valid option for this question
            const selectedOption = fc.sample(fc.constantFrom(...question.options), 1)[0];
            
            // Get initial state - should have no answers
            const initialAnswers = service.getAnswers(sessionId);
            expect(initialAnswers).toHaveLength(0);
            
            // Submit the answer
            const updatedAnswers = service.submitAnswer(sessionId, question.id, selectedOption.id);
            
            // Verify the answer was recorded correctly
            expect(updatedAnswers).toHaveLength(1);
            expect(updatedAnswers[0].questionId).toBe(question.id);
            expect(updatedAnswers[0].selectedOption).toBe(selectedOption.id);
            expect(updatedAnswers[0].timestamp).toBeInstanceOf(Date);
            
            // Verify the answer is persisted in the session
            const persistedAnswers = service.getAnswers(sessionId);
            expect(persistedAnswers).toHaveLength(1);
            expect(persistedAnswers[0].questionId).toBe(question.id);
            expect(persistedAnswers[0].selectedOption).toBe(selectedOption.id);
            
            // Verify progression: the answer should be included in user profile generation
            const profile = service.getUserProfile(sessionId);
            expect(profile.answers).toHaveLength(1);
            expect(profile.answers[0].questionId).toBe(question.id);
            expect(profile.answers[0].selectedOption).toBe(selectedOption.id);
            
            // Verify that the answer contributes to preference calculation
            const categoryPreference = profile.preferences[question.category];
            expect(typeof categoryPreference).toBe('number');
            expect(categoryPreference).toBeCloseTo(selectedOption.value, 10); // For single answer, should equal option value
            
            // Clean up
            service.clearSession(sessionId);
          }
        ), { numRuns: 100 });
      });
    });

    describe('Property 4: Answer weighting consistency', () => {
      /**
       * **Feature: yamanote-station-finder, Property 4: Answer weighting consistency**
       * For any user answer selection, the system should apply appropriate weighting 
       * based on question importance and record the weighted value
       * **Validates: Requirements 2.4**
       */
      it('should apply consistent weighting for any valid answer selection', () => {
        fc.assert(fc.property(
          fc.constantFrom(...service.getQuestions()),
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `session-${s}`),
          (question, sessionId) => {
            // Clean up any existing session
            service.clearSession(sessionId);
            
            // Select a random valid option for this question
            const selectedOption = fc.sample(fc.constantFrom(...question.options), 1)[0];
            
            // Submit the answer
            service.submitAnswer(sessionId, question.id, selectedOption.id);
            
            // Get the user profile to trigger weighting calculation
            const profile = service.getUserProfile(sessionId);
            
            // Verify that the weighting was applied correctly
            // The weighted score should be: selectedOption.value * question.weight
            const expectedWeightedContribution = selectedOption.value * question.weight;
            
            // Since we only answered one question, the category preference should equal
            // the weighted score divided by the question weight (which normalizes back to the weighted average)
            const actualCategoryPreference = profile.preferences[question.category];
            
            // For a single answer, the normalized preference should equal the option value
            // because: (selectedOption.value * question.weight) / question.weight = selectedOption.value
            expect(actualCategoryPreference).toBeCloseTo(selectedOption.value, 10);
            
            // Verify the answer was recorded with correct timestamp
            const answers = service.getAnswers(sessionId);
            expect(answers).toHaveLength(1);
            expect(answers[0].questionId).toBe(question.id);
            expect(answers[0].selectedOption).toBe(selectedOption.id);
            expect(answers[0].timestamp).toBeInstanceOf(Date);
            
            // Clean up
            service.clearSession(sessionId);
          }
        ), { numRuns: 100 });
      });
    });
  });
});