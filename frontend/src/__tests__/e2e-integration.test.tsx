import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import diagnosticReducer from '../store/slices/diagnosticSlice';

// This test file tests the complete integration between frontend and backend
// It uses real API calls (mocked at the fetch level) to test the entire system

// Mock fetch to simulate real backend responses
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Real-like test data that matches the actual system structure
const realQuestions = [
  {
    id: 'housing_01',
    category: 'housing',
    text: 'どのような住環境を重視しますか？',
    weight: 1,
    options: [
      { id: 'housing_01_a', text: '静かで落ち着いた住宅街', value: 5, tags: ['quiet', 'residential'] },
      { id: 'housing_01_b', text: '便利で活気のある商業地区', value: 3, tags: ['convenient', 'commercial'] }
    ]
  },
  {
    id: 'transport_01',
    category: 'transport',
    text: '交通の利便性について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'transport_01_a', text: '複数路線へのアクセス', value: 5, tags: ['multi-line'] },
      { id: 'transport_01_b', text: '駅から近い距離', value: 4, tags: ['proximity'] }
    ]
  },
  {
    id: 'commercial_01',
    category: 'commercial',
    text: '商業施設について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'commercial_01_a', text: 'ショッピングモール', value: 5, tags: ['shopping'] },
      { id: 'commercial_01_b', text: 'コンビニや日用品店', value: 4, tags: ['convenience'] }
    ]
  }
];

const realStations = [
  {
    id: 'shibuya',
    name: '渋谷',
    nameEn: 'Shibuya',
    location: { latitude: 35.6580, longitude: 139.7016 },
    features: {
      housing: { rentLevel: 3, familyFriendly: 3, quietness: 2 },
      transport: { accessibility: 5, connections: ['JR山手線', 'JR埼京線'], walkability: 4 },
      commercial: { shopping: 5, restaurants: 5, convenience: 5 },
      culture: { entertainment: 5, history: 3, nightlife: 5 },
      price: { costOfLiving: 4, diningCost: 4 }
    },
    description: '若者文化の中心地'
  },
  {
    id: 'shinjuku',
    name: '新宿',
    nameEn: 'Shinjuku',
    location: { latitude: 35.6896, longitude: 139.7006 },
    features: {
      housing: { rentLevel: 3, familyFriendly: 2, quietness: 1 },
      transport: { accessibility: 5, connections: ['JR山手線', 'JR中央線'], walkability: 3 },
      commercial: { shopping: 5, restaurants: 5, convenience: 5 },
      culture: { entertainment: 4, history: 3, nightlife: 5 },
      price: { costOfLiving: 4, diningCost: 3 }
    },
    description: '東京最大のターミナル駅'
  }
];

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      diagnostic: diagnosticReducer,
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Complete System Integration', () => {
    test('should complete full diagnostic flow with real-like API interactions', async () => {
      let sessionId = 'e2e-test-session-' + Date.now();
      let callCount = 0;

      // Mock API responses in sequence
      mockFetch.mockImplementation((url: string, options?: any) => {
        callCount++;
        
        // Questions fetch
        if (url.includes('/api/questions') && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: realQuestions
            })
          });
        }
        
        // Answer submissions
        if (url.includes('/api/answers') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          const questionIndex = realQuestions.findIndex(q => q.id === body.questionId);
          const isLastQuestion = questionIndex === realQuestions.length - 1;
          
          // Build answers array up to current question
          const answers = realQuestions.slice(0, questionIndex + 1).map((q) => ({
            questionId: q.id,
            selectedOption: q.options[0].id,
            timestamp: new Date()
          }));
          
          const userProfile = isLastQuestion ? {
            preferences: {
              housing: 4.5,
              transport: 4.8,
              commercial: 3.2,
              culture: 3.0,
              price: 3.5
            },
            priorities: ['quiet', 'multi-line'],
            answers: answers
          } : undefined;
          
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                sessionId: sessionId,
                answers: answers,
                isComplete: isLastQuestion,
                ...(userProfile && { userProfile })
              }
            })
          });
        }
        
        // Recommendations fetch
        if (url.includes('/api/recommendations') && options?.method === 'POST') {
          const recommendations = [
            {
              station: realStations[1], // Shinjuku
              score: 85.2,
              rank: 1,
              explanation: {
                matchingFeatures: ['交通利便性', '商業施設の充実'],
                strengths: ['日本最大のターミナル駅', '24時間営業の店舗多数'],
                considerations: ['騒音レベルが高い', '人混みが激しい']
              }
            },
            {
              station: realStations[0], // Shibuya
              score: 78.9,
              rank: 2,
              explanation: {
                matchingFeatures: ['交通利便性', 'エンターテイメント'],
                strengths: ['多数の路線が利用可能', '若者文化の中心'],
                considerations: ['家賃が高め', '観光客が多い']
              }
            }
          ];
          
          // Add delay to allow loading state to be visible
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: {
                    recommendations: recommendations,
                    userProfile: {
                      preferences: {
                        housing: 4.5,
                        transport: 4.8,
                        commercial: 3.2,
                        culture: 3.0,
                        price: 3.5
                      },
                      priorities: ['quiet', 'multi-line'],
                      answers: []
                    },
                    totalStationsAnalyzed: 29,
                    generatedAt: new Date().toISOString()
                  }
                })
              });
            }, 100); // 100ms delay to allow loading state to be visible
          });
        }
        
        // Default error for unhandled requests
        return Promise.reject(new Error(`Unhandled request: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('山手線駅診断アプリ')).toBeInTheDocument();
      });

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText(realQuestions[0].text)).toBeInTheDocument();
      });

      // Complete diagnostic flow
      for (let i = 0; i < realQuestions.length; i++) {
        const question = realQuestions[i];
        
        // Verify question is displayed
        expect(screen.getByText(question.text)).toBeInTheDocument();
        
        // Select first option
        const optionButton = screen.getByText(question.options[0].text);
        await act(async () => {
          fireEvent.click(optionButton);
        });
        
        // Submit answer
        const submitButton = screen.getByText('次へ');
        await act(async () => {
          fireEvent.click(submitButton);
        });
        
        // Wait for next step
        if (i < realQuestions.length - 1) {
          await waitFor(() => {
            expect(screen.getByText(realQuestions[i + 1].text)).toBeInTheDocument();
          });
        } else {
          // Last question - should show loading then results
          await waitFor(() => {
            expect(screen.getByText('推薦を生成中...')).toBeInTheDocument();
          });
        }
      }

      // Wait for recommendations
      await waitFor(() => {
        expect(screen.getByText('あなたにおすすめの山手線駅')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify recommendations are displayed
      expect(screen.getByText('新宿')).toBeInTheDocument();
      expect(screen.getByText('渋谷')).toBeInTheDocument();
      
      // Verify scores
      expect(screen.getByText(/適合度: 85%/)).toBeInTheDocument();
      expect(screen.getByText(/適合度: 79%/)).toBeInTheDocument();
      
      // Verify rankings
      expect(screen.getByText('1位')).toBeInTheDocument();
      expect(screen.getByText('2位')).toBeInTheDocument();

      // Verify API calls were made correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions'),
        expect.any(Object)
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/answers'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    test('should handle network errors and recovery across the full flow', async () => {
      // Mock initial failure then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: realQuestions
          })
        });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('診断でエラーが発生しました')).toBeInTheDocument();
      });

      // Click restart
      const restartButton = screen.getByText('最初からやり直す');
      await act(async () => {
        fireEvent.click(restartButton);
      });

      // Should recover and show questions
      await waitFor(() => {
        expect(screen.getByText(realQuestions[0].text)).toBeInTheDocument();
      });
    });

    test('should maintain data consistency across multiple API calls', async () => {
      const sessionId = 'consistency-test-session';
      let submittedAnswers: any[] = [];

      mockFetch.mockImplementation((url: string, options?: any) => {
        // Questions fetch
        if (url.includes('/api/questions') && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: realQuestions
            })
          });
        }
        
        // Answer submissions - track consistency
        if (url.includes('/api/answers') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          submittedAnswers.push(body);
          
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                sessionId: sessionId,
                answers: submittedAnswers.map((ans) => ({
                  questionId: ans.questionId,
                  selectedOption: ans.selectedOptionId,
                  timestamp: new Date()
                })),
                isComplete: submittedAnswers.length === realQuestions.length,
                ...(submittedAnswers.length === realQuestions.length && {
                  userProfile: {
                    preferences: { housing: 4, transport: 5, commercial: 3, culture: 3, price: 4 },
                    priorities: ['quiet', 'multi-line'],
                    answers: []
                  }
                })
              }
            })
          });
        }
        
        // Recommendations - verify session consistency
        if (url.includes('/api/recommendations') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          
          // Verify session ID is maintained
          expect(body.sessionId).toBe(sessionId);
          
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                recommendations: [{
                  station: realStations[0],
                  score: 80,
                  rank: 1,
                  explanation: {
                    matchingFeatures: ['test'],
                    strengths: ['test'],
                    considerations: ['test']
                  }
                }],
                userProfile: {
                  preferences: { housing: 4, transport: 5, commercial: 3, culture: 3, price: 4 },
                  priorities: ['quiet', 'multi-line'],
                  answers: []
                },
                totalStationsAnalyzed: 29,
                generatedAt: new Date().toISOString()
              }
            })
          });
        }
        
        return Promise.reject(new Error(`Unhandled request: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Complete first two questions
      await waitFor(() => {
        expect(screen.getByText(realQuestions[0].text)).toBeInTheDocument();
      });

      // Answer first question
      const firstOption = screen.getByText(realQuestions[0].options[0].text);
      await act(async () => {
        fireEvent.click(firstOption);
      });

      const submitButton1 = screen.getByText('次へ');
      await act(async () => {
        fireEvent.click(submitButton1);
      });

      // Answer second question
      await waitFor(() => {
        expect(screen.getByText(realQuestions[1].text)).toBeInTheDocument();
      });

      const secondOption = screen.getByText(realQuestions[1].options[0].text);
      await act(async () => {
        fireEvent.click(secondOption);
      });

      const submitButton2 = screen.getByText('次へ');
      await act(async () => {
        fireEvent.click(submitButton2);
      });

      // Verify session ID consistency
      expect(submittedAnswers[0].sessionId).toBeUndefined(); // First call has no session
      expect(submittedAnswers[1].sessionId).toBe(sessionId); // Second call uses returned session
    });

    test('should validate complete data flow from questions to recommendations', async () => {
      const testSessionId = 'data-flow-test';
      const capturedData: any = {};

      mockFetch.mockImplementation((url: string, options?: any) => {
        // Capture questions data
        if (url.includes('/api/questions')) {
          capturedData.questions = realQuestions;
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: realQuestions })
          });
        }
        
        // Capture answer data
        if (url.includes('/api/answers') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          capturedData.lastAnswer = body;
          
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                sessionId: testSessionId,
                answers: [{ 
                  questionId: body.questionId, 
                  selectedOption: body.selectedOptionId, 
                  timestamp: new Date() 
                }],
                isComplete: true,
                userProfile: {
                  preferences: { housing: 5, transport: 4, commercial: 3, culture: 2, price: 4 },
                  priorities: ['quiet'],
                  answers: []
                }
              }
            })
          });
        }
        
        // Capture recommendation request data
        if (url.includes('/api/recommendations') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          capturedData.recommendationRequest = body;
          
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                recommendations: [{
                  station: realStations[0],
                  score: 88.5,
                  rank: 1,
                  explanation: {
                    matchingFeatures: ['静かな環境', '交通利便性'],
                    strengths: ['住みやすい', 'アクセス良好'],
                    considerations: ['価格帯は中程度']
                  }
                }],
                userProfile: {
                  preferences: { housing: 5, transport: 4, commercial: 3, culture: 2, price: 4 },
                  priorities: ['quiet'],
                  answers: []
                },
                totalStationsAnalyzed: 29,
                generatedAt: new Date().toISOString()
              }
            })
          });
        }
        
        return Promise.reject(new Error(`Unhandled: ${url}`));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Complete one question to trigger the full flow
      await waitFor(() => {
        expect(screen.getByText(realQuestions[0].text)).toBeInTheDocument();
      });

      const option = screen.getByText(realQuestions[0].options[0].text);
      await act(async () => {
        fireEvent.click(option);
      });

      const submitButton = screen.getByText('次へ');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Wait for recommendations
      await waitFor(() => {
        expect(screen.getByText('あなたにおすすめの山手線駅')).toBeInTheDocument();
      });

      // Validate data flow
      expect(capturedData.questions).toBeDefined();
      expect(capturedData.lastAnswer).toBeDefined();
      expect(capturedData.recommendationRequest).toBeDefined();
      
      // Verify question data was used correctly
      expect(capturedData.lastAnswer.questionId).toBe(realQuestions[0].id);
      expect(capturedData.lastAnswer.selectedOptionId).toBe(realQuestions[0].options[0].id);
      
      // Verify session consistency
      expect(capturedData.recommendationRequest.sessionId).toBe(testSessionId);
      
      // Verify recommendation display
      expect(screen.getByText('渋谷')).toBeInTheDocument();
      expect(screen.getByText(/適合度: 89%/)).toBeInTheDocument();
    });
  });
});