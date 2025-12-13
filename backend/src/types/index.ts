// Question Model
export interface Question {
  id: string;
  category: 'housing' | 'transport' | 'commercial' | 'culture' | 'price' | 'priority';
  text: string;
  options: QuestionOption[];
  weight: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
  tags: string[];
}

// Station Model
export interface Station {
  id: string;
  name: string;
  nameEn: string;
  location: {
    latitude: number;
    longitude: number;
  };
  features: StationFeatures;
  description: string;
  rentPrices?: {
    oneK: number;      // 1K平均家賃（万円）
    oneLDK: number;    // 1LDK平均家賃（万円）
    twoLDK: number;    // 2LDK平均家賃（万円）
    threeLDK: number;  // 3LDK平均家賃（万円）
  };
}

export interface StationFeatures {
  housing: {
    rentLevel: number; // 1-5 scale
    familyFriendly: number;
    quietness: number;
  };
  transport: {
    accessibility: number;
    connections: string[];
    walkability: number;
  };
  commercial: {
    shopping: number;
    restaurants: number;
    convenience: number;
  };
  culture: {
    entertainment: number;
    history: number;
    nightlife: number;
  };
  price: {
    costOfLiving: number;
    diningCost: number;
  };
}

// User Profile Model
export interface UserProfile {
  preferences: {
    housing: number;
    transport: number;
    commercial: number;
    culture: number;
    price: number;
  };
  priorities: string[];
  categoryWeights: {
    housing: number;
    transport: number;
    commercial: number;
    culture: number;
    price: number;
  };
  answers: Answer[];
}

export interface Answer {
  questionId: string;
  selectedOption: string;
  timestamp: Date;
}

// Recommendation Model
export interface Recommendation {
  station: Station;
  score: number;
  rank: number;
  explanation: RecommendationExplanation;
}

export interface RecommendationExplanation {
  matchingFeatures: string[];
  strengths: string[];
  considerations: string[];
}

// Category enum for better type safety
export type QuestionCategory = 'housing' | 'transport' | 'commercial' | 'culture' | 'price' | 'priority';