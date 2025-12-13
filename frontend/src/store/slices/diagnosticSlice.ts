import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Question, Answer, UserProfile, Recommendation } from '../../types';
import { api, ApiError } from '../../services';

interface DiagnosticState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  userProfile: UserProfile | null;
  recommendations: Recommendation[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

const initialState: DiagnosticState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  userProfile: null,
  recommendations: [],
  sessionId: null,
  isLoading: false,
  error: null,
  isComplete: false,
};

// Async thunks for API calls
export const fetchQuestions = createAsyncThunk(
  'diagnostic/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const questions = await api.diagnostic.getQuestions();
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('有効な質問データが見つかりません。');
      }
      return questions;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error instanceof Error ? error.message : '質問の取得に失敗しました。');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'diagnostic/submitAnswer',
  async (
    { questionId, selectedOption, sessionId }: { 
      questionId: string; 
      selectedOption: string; 
      sessionId?: string;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const result = await api.diagnostic.submitAnswer(questionId, selectedOption, sessionId);
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error instanceof Error ? error.message : '回答の送信に失敗しました。');
    }
  }
);

export const generateRecommendations = createAsyncThunk(
  'diagnostic/generateRecommendations',
  async (
    { sessionId, userProfile }: { sessionId?: string; userProfile?: UserProfile }, 
    { rejectWithValue }
  ) => {
    try {
      if (!sessionId && !userProfile) {
        throw new Error('セッションIDまたはユーザープロファイルが必要です。');
      }
      
      const result = await api.recommendation.generateRecommendations(userProfile, sessionId);
      
      if (!result.recommendations || result.recommendations.length === 0) {
        throw new Error('推薦結果を生成できませんでした。診断をやり直してください。');
      }
      
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error instanceof Error ? error.message : '推薦の生成に失敗しました。');
    }
  }
);

const diagnosticSlice = createSlice({
  name: 'diagnostic',
  initialState,
  reducers: {
    recordAnswer: (state, action: PayloadAction<Answer>) => {
      state.answers.push(action.payload);
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    resetDiagnostic: (state) => {
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.userProfile = null;
      state.recommendations = [];
      state.sessionId = null;
      state.isComplete = false;
      state.error = null;
    },
    setComplete: (state) => {
      state.isComplete = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    retryLastAction: (state) => {
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || '質問の取得に失敗しました';
      })
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
        state.answers = action.payload.answers;
        if (action.payload.userProfile) {
          state.userProfile = action.payload.userProfile;
        }
        if (action.payload.isComplete) {
          state.isComplete = action.payload.isComplete;
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || '回答の送信に失敗しました';
      })
      // Generate recommendations
      .addCase(generateRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendations = action.payload.recommendations;
        state.userProfile = action.payload.userProfile;
        state.isComplete = true;
      })
      .addCase(generateRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || '推薦の生成に失敗しました';
      });
  },
});

export const {
  recordAnswer,
  nextQuestion,
  previousQuestion,
  resetDiagnostic,
  setComplete,
  clearError,
  retryLastAction,
} = diagnosticSlice.actions;

export default diagnosticSlice.reducer;