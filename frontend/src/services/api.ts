import { Question, Answer, UserProfile, Recommendation, Station } from '../types';

// API Response wrapper interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// API Error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle network errors
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we can't parse error response, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new ApiError(errorMessage, response.status);
    }

    const data: ApiResponse<T> = await response.json();
    
    // Handle API-level errors
    if (!data.success) {
      throw new ApiError(
        data.message || data.error || 'API request failed',
        undefined,
        'API_ERROR'
      );
    }

    return data.data;
  } catch (error) {
    // Handle network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'ネットワーク接続を確認してください。サーバーに接続できません。',
        undefined,
        'NETWORK_ERROR'
      );
    }
    
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : '不明なエラーが発生しました。',
      undefined,
      'UNKNOWN_ERROR'
    );
  }
}

// Diagnostic API methods
export const diagnosticApi = {
  // Get all diagnostic questions
  async getQuestions(): Promise<Question[]> {
    return apiRequest<Question[]>('/questions');
  },

  // Submit an answer for a diagnostic question
  async submitAnswer(
    questionId: string, 
    selectedOptionId: string, 
    sessionId?: string
  ): Promise<{
    sessionId: string;
    answers: Answer[];
    isComplete: boolean;
    userProfile?: UserProfile;
  }> {
    return apiRequest('/answers', {
      method: 'POST',
      body: JSON.stringify({
        questionId,
        selectedOptionId,
        sessionId,
      }),
    });
  },

  // Get answers for a session
  async getSessionAnswers(sessionId: string): Promise<{
    sessionId: string;
    answers: Answer[];
    isComplete: boolean;
  }> {
    return apiRequest(`/sessions/${sessionId}/answers`);
  },

  // Get user profile for a session
  async getUserProfile(sessionId: string): Promise<UserProfile> {
    return apiRequest(`/sessions/${sessionId}/profile`);
  },

  // Clear session data
  async clearSession(sessionId: string): Promise<{ message: string }> {
    return apiRequest(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// Station API methods
export const stationApi = {
  // Get all stations
  async getAllStations(): Promise<{ stations: Station[]; count: number }> {
    return apiRequest('/stations');
  },

  // Get station by ID
  async getStationById(id: string): Promise<Station> {
    return apiRequest(`/stations/${id}`);
  },

  // Get station features
  async getStationFeatures(id: string): Promise<Station['features']> {
    return apiRequest(`/stations/${id}/features`);
  },

  // Search stations by name
  async searchStations(name: string): Promise<{ stations: Station[]; count: number }> {
    return apiRequest(`/stations?name=${encodeURIComponent(name)}`);
  },

  // Validate station data completeness
  async validateStationData(): Promise<{
    isValid: boolean;
    stationCount: number;
    expectedCount: number;
    isComplete: boolean;
  }> {
    return apiRequest('/stations/validate/data');
  },
};

// Recommendation API methods
export const recommendationApi = {
  // Generate recommendations based on user profile
  async generateRecommendations(
    userProfile?: UserProfile,
    sessionId?: string
  ): Promise<{
    recommendations: Recommendation[];
    userProfile: UserProfile;
    totalStationsAnalyzed: number;
    generatedAt: string;
  }> {
    return apiRequest('/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        userProfile,
        sessionId,
      }),
    });
  },

  // Get compatibility scores for all stations
  async getCompatibilityScores(
    userProfile?: UserProfile,
    sessionId?: string
  ): Promise<{
    scores: Array<{ stationId: string; score: number }>;
    userProfile: UserProfile;
    totalStations: number;
    calculatedAt: string;
  }> {
    return apiRequest('/recommendations/scores', {
      method: 'POST',
      body: JSON.stringify({
        userProfile,
        sessionId,
      }),
    });
  },

  // Get explanation for a specific station recommendation
  async explainRecommendation(
    stationId: string,
    userProfile?: UserProfile,
    sessionId?: string
  ): Promise<{
    station: Station;
    score: number;
    explanation: Recommendation['explanation'];
    userProfile: UserProfile;
    explainedAt: string;
  }> {
    return apiRequest(`/recommendations/explain/${stationId}`, {
      method: 'POST',
      body: JSON.stringify({
        userProfile,
        sessionId,
      }),
    });
  },
};

// Health check
export const healthApi = {
  async checkHealth(): Promise<{ status: string; message: string }> {
    return apiRequest('/health');
  },
};

// Export all APIs
export const api = {
  diagnostic: diagnosticApi,
  station: stationApi,
  recommendation: recommendationApi,
  health: healthApi,
};

export default api;