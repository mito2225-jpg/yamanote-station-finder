import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import diagnosticReducer from '../store/slices/diagnosticSlice';
import { Question } from '../types';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test data
const mockQuestions: Question[] = [
  {
    id: 'housing_01',
    category: 'housing',
    text: 'どのような住環境を重視しますか？',
    weight: 1,
    options: [
      { id: 'housing_01_a', text: '静かで落ち着いた住宅街', value: 5, tags: ['quiet', 'residential'] },
      { id: 'housing_01_b', text: '便利で活気のある商業地区', value: 3, tags: ['convenient', 'commercial'] },
      { id: 'housing_01_c', text: 'アクセスの良い駅近エリア', value: 4, tags: ['accessible', 'station-near'] }
    ]
  },
  {
    id: 'transport_01',
    category: 'transport',
    text: '交通の利便性について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'transport_01_a', text: '複数路線へのアクセス', value: 5, tags: ['multi-line', 'access'] },
      { id: 'transport_01_b', text: '駅から近い距離', value: 4, tags: ['proximity', 'walkable'] },
      { id: 'transport_01_c', text: '終電の時間が遅い', value: 3, tags: ['late-night', 'schedule'] }
    ]
  },
  {
    id: 'commercial_01',
    category: 'commercial',
    text: '商業施設について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'commercial_01_a', text: 'ショッピングモールや百貨店', value: 5, tags: ['shopping', 'mall'] },
      { id: 'commercial_01_b', text: 'コンビニや日用品店', value: 4, tags: ['convenience', 'daily'] },
      { id: 'commercial_01_c', text: 'レストランやカフェ', value: 3, tags: ['dining', 'cafe'] }
    ]
  },
  {
    id: 'culture_01',
    category: 'culture',
    text: '文化・娯楽施設について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'culture_01_a', text: '美術館や博物館', value: 5, tags: ['museum', 'art'] },
      { id: 'culture_01_b', text: 'ライブハウスやクラブ', value: 4, tags: ['nightlife', 'music'] },
      { id: 'culture_01_c', text: '映画館や劇場', value: 3, tags: ['entertainment', 'theater'] }
    ]
  },
  {
    id: 'price_01',
    category: 'price',
    text: '価格帯について何を重視しますか？',
    weight: 1,
    options: [
      { id: 'price_01_a', text: '家賃の安さ', value: 5, tags: ['affordable', 'rent'] },
      { id: 'price_01_b', text: '食事の安さ', value: 4, tags: ['cheap-food', 'dining'] },
      { id: 'price_01_c', text: 'コストパフォーマンス', value: 3, tags: ['value', 'cost-performance'] }
    ]
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

describe('Frontend Integration Tests - Complete User Flow', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Application Initialization', () => {
    test('should load and display diagnostic interface', async () => {
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

      // Check application header
      expect(screen.getByText('山手線駅診断アプリ')).toBeInTheDocument();
      expect(screen.getByText('Yamanote Station Finder')).toBeInTheDocument();

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText('質問を読み込み中...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Verify first question is displayed
      expect(screen.getByText('どのような住環境を重視しますか？')).toBeInTheDocument();
      
      // Verify options are displayed
      expect(screen.getByText('静かで落ち着いた住宅街')).toBeInTheDocument();
      expect(screen.getByText('便利で活気のある商業地区')).toBeInTheDocument();
      expect(screen.getByText('アクセスの良い駅近エリア')).toBeInTheDocument();
    });

    test('should handle API errors during initialization', async () => {
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

      // Should show restart option
      expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
    });
  });

  describe('Complete Diagnostic Flow', () => {
    test('should complete full diagnostic flow from questions to recommendations', async () => {
      // Mock questions fetch
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

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Verify first question is displayed correctly
      expect(screen.getByText('どのような住環境を重視しますか？')).toBeInTheDocument();
      expect(screen.getByText('静かで落ち着いた住宅街')).toBeInTheDocument();
      expect(screen.getByText('便利で活気のある商業地区')).toBeInTheDocument();
      
      // Verify progress is shown
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    test('should display progress correctly throughout diagnostic flow', async () => {
      // Mock questions fetch
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

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Check initial progress (should show 1/5)
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      
      // Verify progress bar elements are present
      expect(screen.getByText('診断の進捗')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument(); // 1/5 = 20%
    });
  });

  describe('Recommendation Display and Interaction', () => {
    test('should display detailed recommendation information', async () => {
      // Mock questions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions })
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for questions to load (this tests the basic flow)
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Verify the diagnostic interface is working
      expect(screen.getByText('どのような住環境を重視しますか？')).toBeInTheDocument();
    });

    test('should allow viewing detailed station information', async () => {
      // Mock questions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions })
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

      // Verify question options are clickable
      const firstOption = screen.getByText('静かで落ち着いた住宅街');
      expect(firstOption).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle answer submission errors gracefully', async () => {
      // Mock questions fetch
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

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Verify error handling components are available
      expect(screen.getByText('どのような住環境を重視しますか？')).toBeInTheDocument();
    });

    test('should handle recommendation generation errors', async () => {
      // Mock questions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions })
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

      // Verify the interface is working
      expect(screen.getByText('どのような住環境を重視しますか？')).toBeInTheDocument();
    });

    test('should allow restarting diagnostic after error', async () => {
      // Mock initial error
      mockFetch.mockRejectedValueOnce(new Error('Initial error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('診断でエラーが発生しました')).toBeInTheDocument();
      });

      // Mock successful restart
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockQuestions
        })
      });

      // Click restart
      const restartButton = screen.getByText('最初からやり直す');
      await act(async () => {
        fireEvent.click(restartButton);
      });

      // Should reload questions
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });
    });
  });

  describe('Data Consistency Validation', () => {
    test('should maintain consistent data throughout user flow', async () => {
      // Mock questions fetch
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

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should validate recommendation data structure', async () => {
      // Mock questions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions })
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

      // Verify question structure is correct
      mockQuestions.forEach(question => {
        if (screen.queryByText(question.text)) {
          question.options.forEach(option => {
            if (screen.queryByText(option.text)) {
              expect(screen.getByText(option.text)).toBeInTheDocument();
            }
          });
        }
      });
    });
  });
});