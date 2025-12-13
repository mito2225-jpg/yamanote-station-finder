import { Question, UserProfile, Answer, QuestionCategory } from '../types';
import { questionsData } from '../data';

export class DiagnosticService {
  private questions: Question[];
  private userSessions: Map<string, { answers: Answer[], profile?: UserProfile }>;

  constructor() {
    this.questions = questionsData as Question[];
    this.userSessions = new Map();
  }

  /**
   * Get all diagnostic questions
   * @returns Array of all questions
   */
  getQuestions(): Question[] {
    return this.questions;
  }

  /**
   * Get questions by category
   * @param category The category to filter by
   * @returns Array of questions in the specified category
   */
  getQuestionsByCategory(category: QuestionCategory): Question[] {
    return this.questions.filter(q => q.category === category);
  }

  /**
   * Submit an answer for a question
   * @param sessionId Unique session identifier
   * @param questionId The question being answered
   * @param selectedOptionId The selected option ID
   * @returns Updated answer array for the session
   */
  submitAnswer(sessionId: string, questionId: string, selectedOptionId: string): Answer[] {
    // Initialize session if it doesn't exist
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, { answers: [] });
    }

    const session = this.userSessions.get(sessionId)!;
    
    // Find the question to validate the answer
    const question = this.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    // Validate the selected option
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    if (!selectedOption) {
      throw new Error(`Option with id ${selectedOptionId} not found for question ${questionId}`);
    }

    // Create the answer
    const answer: Answer = {
      questionId,
      selectedOption: selectedOptionId,
      timestamp: new Date()
    };

    // Remove any existing answer for this question and add the new one
    session.answers = session.answers.filter(a => a.questionId !== questionId);
    session.answers.push(answer);

    return session.answers;
  }

  /**
   * Generate user profile from answers
   * @param sessionId The session identifier
   * @returns Generated user profile
   */
  getUserProfile(sessionId: string): UserProfile {
    const session = this.userSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // If profile already calculated, return it
    if (session.profile) {
      return session.profile;
    }

    const answers = session.answers;
    
    // Initialize preference scores
    const preferences = {
      housing: 0,
      transport: 0,
      commercial: 0,
      culture: 0,
      price: 0
    };

    // Calculate weighted scores for each category (excluding priority questions)
    const categoryWeights = {
      housing: 0,
      transport: 0,
      commercial: 0,
      culture: 0,
      price: 0
    };

    // Process each answer (excluding priority questions)
    for (const answer of answers) {
      const question = this.questions.find(q => q.id === answer.questionId);
      if (!question || question.category === 'priority') continue;

      const selectedOption = question.options.find(opt => opt.id === answer.selectedOption);
      if (!selectedOption) continue;

      // Add weighted score to the category
      const weightedScore = selectedOption.value * question.weight;
      preferences[question.category as keyof typeof preferences] += weightedScore;
      categoryWeights[question.category as keyof typeof categoryWeights] += question.weight;
    }

    // Normalize scores by total weight in each category
    for (const category of Object.keys(preferences) as (keyof typeof preferences)[]) {
      if (categoryWeights[category] > 0) {
        preferences[category] = preferences[category] / categoryWeights[category];
      }
    }

    // Calculate category weights from priority question
    const userCategoryWeights = {
      housing: 1.0,
      transport: 1.0,
      commercial: 1.0,
      culture: 1.0,
      price: 1.0
    };

    // Find priority question answer
    const priorityAnswer = answers.find(a => a.questionId === 'priority_01');
    if (priorityAnswer) {
      // Reset all weights to base level
      Object.keys(userCategoryWeights).forEach(key => {
        userCategoryWeights[key as keyof typeof userCategoryWeights] = 0.5;
      });

      // Apply high weight to selected category
      const selectedOption = priorityAnswer.selectedOption;
      if (selectedOption.includes('housing')) {
        userCategoryWeights.housing = 2.0;
        userCategoryWeights.price = 2.0; // Also boost price for cost-related items
      }
      if (selectedOption.includes('transport')) userCategoryWeights.transport = 2.0;
      if (selectedOption.includes('commercial')) userCategoryWeights.commercial = 2.0;
      if (selectedOption.includes('culture')) userCategoryWeights.culture = 2.0;
      if (selectedOption.includes('price')) {
        userCategoryWeights.price = 3.0;    // Extra strong weight for price priority
        userCategoryWeights.housing = 2.5;  // Strong boost for housing cost-related items
      }
      if (selectedOption.includes('none')) {
        // Keep all weights at 1.0 for balanced approach
        Object.keys(userCategoryWeights).forEach(key => {
          userCategoryWeights[key as keyof typeof userCategoryWeights] = 1.0;
        });
      }
    }

    // Extract priorities from answer tags
    const priorities: string[] = [];
    const tagCounts = new Map<string, number>();

    for (const answer of answers) {
      const question = this.questions.find(q => q.id === answer.questionId);
      if (!question || question.category === 'priority') continue;

      const selectedOption = question.options.find(opt => opt.id === answer.selectedOption);
      if (!selectedOption) continue;

      // Count tags weighted by question importance
      for (const tag of selectedOption.tags) {
        const currentCount = tagCounts.get(tag) || 0;
        tagCounts.set(tag, currentCount + question.weight);
      }
    }

    // Get top priority tags
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    priorities.push(...sortedTags);

    // Create user profile
    const profile: UserProfile = {
      preferences,
      priorities,
      categoryWeights: userCategoryWeights,
      answers: [...answers]
    };

    // Cache the profile
    session.profile = profile;

    return profile;
  }

  /**
   * Get answers for a session
   * @param sessionId The session identifier
   * @returns Array of answers for the session
   */
  getAnswers(sessionId: string): Answer[] {
    const session = this.userSessions.get(sessionId);
    return session ? session.answers : [];
  }

  /**
   * Clear session data
   * @param sessionId The session identifier
   */
  clearSession(sessionId: string): void {
    this.userSessions.delete(sessionId);
  }

  /**
   * Check if diagnostic is complete for a session
   * @param sessionId The session identifier
   * @returns True if all questions have been answered
   */
  isDiagnosticComplete(sessionId: string): boolean {
    const session = this.userSessions.get(sessionId);
    if (!session) return false;

    const answeredQuestionIds = new Set(session.answers.map(a => a.questionId));
    return this.questions.every(q => answeredQuestionIds.has(q.id));
  }
}

// Create and export a singleton instance
export const diagnosticService = new DiagnosticService();