import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import diagnosticReducer from './store/slices/diagnosticSlice';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockQuestions = [
  {
    id: 'housing_01',
    category: 'housing' as const,
    text: 'どのような住環境を重視しますか？',
    weight: 1,
    options: [
      { id: 'housing_01_a', text: '静かで落ち着いた住宅街', value: 5, tags: ['quiet'] },
      { id: 'housing_01_b', text: '便利で活気のある商業地区', value: 3, tags: ['convenient'] }
    ]
  },
  {
    id: 'transport_01',
    category: 'transport' as const,
    text: '交通の利便性について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'transport_01_a', text: '複数路線へのアクセス', value: 5, tags: ['access'] },
      { id: 'transport_01_b', text: '駅から近い距離', value: 4, tags: ['proximity'] }
    ]
  }
];

const mockRecommendations = [
  {
    station: {
      id: 'shibuya',
      name: '渋谷',
      nameEn: 'Shibuya',
      location: { latitude: 35.6580, longitude: 139.7016 },
      features: {
        housing: { rentLevel: 3, familyFriendly: 3, quietness: 2 },
        transport: { accessibility: 5, connections: ['JR', 'Metro'], walkability: 4 },
        commercial: { shopping: 5, restaurants: 5, convenience: 5 },
        culture: { entertainment: 5, history: 3, nightlife: 5 },
        price: { costOfLiving: 4, diningCost: 4 }
      },
      description: '若者文化の中心地'
    },
    score: 85.5,
    rank: 1,
    explanation: {
      matchingFeatures: ['交通利便性', '商業施設'],
      strengths: ['多数の路線が利用可能', '豊富なショッピング施設'],
      considerations: ['家賃が高め', '騒音レベルが高い']
    }
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

describe('App Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders app header and diagnostic wizard', async () => {
    // Mock successful questions fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockQuestions
      })
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText('山手線駅診断アプリ')).toBeInTheDocument();
    expect(screen.getByText('Yamanote Station Finder')).toBeInTheDocument();

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText('質問を読み込み中...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('診断でエラーが発生しました')).toBeInTheDocument();
    });
  });

  test('completes full diagnostic flow', async () => {
    // Mock questions fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockQuestions
      })
    });

    // Mock answer submissions
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sessionId: 'test-session-1',
            answers: [{ questionId: 'housing_01', selectedOption: 'housing_01_a', timestamp: new Date() }],
            isComplete: false
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sessionId: 'test-session-1',
            answers: [
              { questionId: 'housing_01', selectedOption: 'housing_01_a', timestamp: new Date() },
              { questionId: 'transport_01', selectedOption: 'transport_01_a', timestamp: new Date() }
            ],
            isComplete: true,
            userProfile: {
              preferences: { housing: 5, transport: 5, commercial: 3, culture: 3, price: 3 },
              priorities: ['quiet', 'access'],
              answers: []
            }
          }
        })
      });

    // Mock recommendations fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          recommendations: mockRecommendations,
          userProfile: {
            preferences: { housing: 5, transport: 5, commercial: 3, culture: 3, price: 3 },
            priorities: ['quiet', 'access'],
            answers: []
          },
          totalStationsAnalyzed: 29,
          generatedAt: new Date().toISOString()
        }
      })
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
    });

    // Answer first question
    const firstOption = screen.getByText(mockQuestions[0].options[0].text);
    fireEvent.click(firstOption);
    
    // Submit first answer
    const submitButton = screen.getByText('次へ');
    fireEvent.click(submitButton);

    // Wait for second question
    await waitFor(() => {
      expect(screen.getByText(mockQuestions[1].text)).toBeInTheDocument();
    });

    // Answer second question
    const secondOption = screen.getByText(mockQuestions[1].options[0].text);
    fireEvent.click(secondOption);
    
    // Submit second answer
    const submitButton2 = screen.getByText('次へ');
    fireEvent.click(submitButton2);

    // Wait for recommendations
    await waitFor(() => {
      expect(screen.getByText('渋谷')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check recommendation details (score is rounded)
    expect(screen.getByText(/適合度: 86%/)).toBeInTheDocument();
    expect(screen.getByText('渋谷')).toBeInTheDocument();
  });

  test('allows restarting diagnostic', async () => {
    // Mock questions fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockQuestions
      })
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
    });

    // Simulate error state by triggering error
    mockFetch.mockRejectedValueOnce(new Error('Test error'));

    // Answer question to trigger error
    const firstOption = screen.getByText(mockQuestions[0].options[0].text);
    fireEvent.click(firstOption);
    
    // Submit to trigger error
    const submitButton = screen.getByText('次へ');
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('診断でエラーが発生しました')).toBeInTheDocument();
    });

    // Click restart button
    const restartButton = screen.getByText('最初からやり直す');
    fireEvent.click(restartButton);

    // Should reload questions
    await waitFor(() => {
      expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
    });
  });
});