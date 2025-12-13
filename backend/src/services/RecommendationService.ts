import { Station, UserProfile, Recommendation, RecommendationExplanation } from '../types';
import { stationService } from './StationService';

/**
 * Service for generating station recommendations based on user preferences
 * Implements scoring algorithm and recommendation generation logic
 */
export class RecommendationService {
  
  /**
   * Calculate compatibility scores between user profile and all stations
   * @param userProfile - User's preferences and priorities
   * @returns Map of station ID to compatibility score
   */
  calculateScores(userProfile: UserProfile): Map<string, number> {
    const stations = stationService.getAllStations();
    const scores = new Map<string, number>();

    for (const station of stations) {
      const score = this.calculateStationScore(userProfile, station);
      scores.set(station.id, score);
    }

    return scores;
  }

  /**
   * Calculate compatibility score for a single station
   * @param userProfile - User's preferences and priorities
   * @param station - Station to score
   * @returns Compatibility score (0-100)
   */
  private calculateStationScore(userProfile: UserProfile, station: Station): number {
    const preferences = userProfile.preferences;
    const categoryWeights = userProfile.categoryWeights || {
      housing: 1.0,
      transport: 1.0,
      commercial: 1.0,
      culture: 1.0,
      price: 1.0
    };
    const features = station.features;
    
    // Calculate weighted scores for each category
    let totalScore = 0;
    let totalWeight = 0;

    // Housing category scoring (excluding rent level - handled with price)
    if (preferences.housing > 0) {
      const housingScore = this.calculateCategoryScore(
        preferences.housing,
        [
          features.housing.familyFriendly,
          features.housing.quietness
        ]
      );
      const weight = preferences.housing * categoryWeights.housing;
      totalScore += housingScore * weight;
      totalWeight += weight;
    }

    // Transport category scoring
    if (preferences.transport > 0) {
      const transportScore = this.calculateCategoryScore(
        preferences.transport,
        [
          features.transport.accessibility,
          Math.min(5, features.transport.connections.length) // Normalize connection count to max 5
        ]
      );
      const weight = preferences.transport * categoryWeights.transport;
      totalScore += transportScore * weight;
      totalWeight += weight;
    }

    // Commercial category scoring
    if (preferences.commercial > 0) {
      const commercialScore = this.calculateCategoryScore(
        preferences.commercial,
        [
          features.commercial.shopping,
          features.commercial.restaurants,
          features.commercial.convenience
        ]
      );
      const weight = preferences.commercial * categoryWeights.commercial;
      totalScore += commercialScore * weight;
      totalWeight += weight;
    }

    // Culture category scoring
    if (preferences.culture > 0) {
      const cultureScore = this.calculateCategoryScore(
        preferences.culture,
        [
          features.culture.entertainment,
          features.culture.history,
          features.culture.nightlife
        ]
      );
      const weight = preferences.culture * categoryWeights.culture;
      totalScore += cultureScore * weight;
      totalWeight += weight;
    }

    // Price category scoring (including rent level - all cost-related items)
    if (preferences.price > 0) {
      // Calculate combined price weight (price preference + housing preference for cost sensitivity)
      const combinedPriceWeight = Math.max(categoryWeights.price, categoryWeights.housing);
      
      // Extra boost if price is heavily prioritized (weight >= 3.0)
      const priceBoostMultiplier = categoryWeights.price >= 3.0 ? 1.5 : 1.0;
      
      const priceScore = this.calculateCategoryScore(
        preferences.price,
        [
          6 - features.housing.rentLevel,   // Include rent level from housing
          6 - features.price.costOfLiving,  // Invert scale (1-5 becomes 5-1)
          6 - features.price.diningCost
        ]
      );
      const weight = preferences.price * combinedPriceWeight * priceBoostMultiplier;
      totalScore += priceScore * weight;
      totalWeight += weight;
    }

    // Calculate final normalized score (0-100)
    const baseScore = totalWeight > 0 ? (totalScore / totalWeight) * 20 : 0; // Scale to 0-100

    // Apply priority bonuses
    const priorityBonus = this.calculatePriorityBonus(userProfile.priorities, station);
    
    return Math.min(100, Math.max(0, baseScore + priorityBonus));
  }

  /**
   * Calculate score for a category based on feature values
   * @param userPreference - User's preference strength for this category (1-5)
   * @param featureValues - Array of feature values for this category
   * @returns Category score (0-5)
   */
  private calculateCategoryScore(userPreference: number, featureValues: number[]): number {
    // Calculate average of feature values
    const avgFeatureValue = featureValues.reduce((sum, val) => sum + val, 0) / featureValues.length;
    
    // Score is based on how well the station's features align with user preference
    // Higher user preference means they want higher feature values
    return avgFeatureValue * (userPreference / 5);
  }

  /**
   * Calculate bonus points based on user priorities
   * @param priorities - User's priority tags
   * @param station - Station to evaluate
   * @returns Bonus points (0-20)
   */
  private calculatePriorityBonus(priorities: string[], station: Station): number {
    let bonus = 0;
    const features = station.features;

    // Define priority mappings to station features
    const priorityMappings: Record<string, () => number> = {
      'family-friendly': () => features.housing.familyFriendly * 2,
      'quiet': () => features.housing.quietness * 2,
      'affordable': () => (6 - features.price.costOfLiving) * 2,
      'shopping': () => features.commercial.shopping * 2,
      'nightlife': () => features.culture.nightlife * 2,
      'entertainment': () => features.culture.entertainment * 2,
      'accessible': () => features.transport.accessibility * 2,
      'walkable': () => features.transport.walkability * 2,
      'restaurants': () => features.commercial.restaurants * 2,
      'history': () => features.culture.history * 2,
      'convenient': () => features.commercial.convenience * 2
    };

    // Apply bonuses for matching priorities
    for (const priority of priorities.slice(0, 3)) { // Top 3 priorities only
      const bonusCalculator = priorityMappings[priority];
      if (bonusCalculator) {
        bonus += bonusCalculator();
      }
    }

    return Math.min(20, bonus); // Cap bonus at 20 points
  }

  /**
   * Generate top 3 station recommendations based on user profile
   * @param userProfile - User's preferences and priorities
   * @returns Array of top 3 recommendations with scores and explanations
   */
  generateRecommendations(userProfile: UserProfile): Recommendation[] {
    // Calculate scores for all stations
    const scores = this.calculateScores(userProfile);
    const stations = stationService.getAllStations();

    // Create station-score pairs and sort by score
    const stationScores = stations.map(station => ({
      station,
      score: scores.get(station.id) || 0
    })).sort((a, b) => b.score - a.score);

    // Generate top 3 recommendations
    const recommendations: Recommendation[] = [];
    
    for (let i = 0; i < Math.min(3, stationScores.length); i++) {
      const { station, score } = stationScores[i];
      const explanation = this.explainRecommendation(station, userProfile);
      
      recommendations.push({
        station,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        rank: i + 1,
        explanation
      });
    }

    return recommendations;
  }

  /**
   * Generate full ranking of all stations based on user profile
   * @param userProfile - User's preferences and priorities
   * @returns Array of all stations ranked by compatibility score
   */
  generateFullRanking(userProfile: UserProfile): Recommendation[] {
    // Calculate scores for all stations
    const scores = this.calculateScores(userProfile);
    const stations = stationService.getAllStations();

    // Create station-score pairs and sort by score
    const stationScores = stations.map(station => ({
      station,
      score: scores.get(station.id) || 0
    })).sort((a, b) => b.score - a.score);

    // Generate full ranking with minimal explanations
    const fullRanking: Recommendation[] = [];
    
    for (let i = 0; i < stationScores.length; i++) {
      const { station, score } = stationScores[i];
      
      fullRanking.push({
        station,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        rank: i + 1,
        explanation: {
          matchingFeatures: [],
          strengths: [],
          considerations: []
        }
      });
    }

    return fullRanking;
  }

  /**
   * Generate explanation for why a station was recommended
   * @param station - The recommended station
   * @param userProfile - User's preferences and priorities
   * @returns Detailed explanation of the recommendation
   */
  explainRecommendation(station: Station, userProfile: UserProfile): RecommendationExplanation {
    const features = station.features;
    const preferences = userProfile.preferences;
    const priorities = userProfile.priorities;

    const matchingFeatures: string[] = [];
    const strengths: string[] = [];
    const considerations: string[] = [];

    // Analyze housing features
    if (preferences.housing > 3) {
      if (features.housing.familyFriendly >= 4) {
        matchingFeatures.push('family-friendly environment');
        strengths.push(`${station.name}は家族連れに優しい環境が整っています`);
      }
      if (features.housing.quietness >= 4) {
        matchingFeatures.push('quiet residential area');
        strengths.push(`${station.name}は静かな住宅地として知られています`);
      }
      if (features.housing.rentLevel <= 2) {
        matchingFeatures.push('affordable housing');
        strengths.push(`${station.name}周辺は比較的手頃な家賃で住むことができます`);
      } else if (features.housing.rentLevel >= 4) {
        considerations.push(`${station.name}周辺の家賃は比較的高めです`);
      }
    }

    // Analyze transport features
    if (preferences.transport > 3) {
      if (features.transport.accessibility >= 4) {
        matchingFeatures.push('excellent accessibility');
        strengths.push(`${station.name}は交通アクセスが非常に良好です`);
      }
      if (features.transport.walkability >= 4) {
        matchingFeatures.push('walkable area');
        strengths.push(`${station.name}周辺は徒歩での移動がしやすい環境です`);
      }
      if (features.transport.connections.length >= 3) {
        matchingFeatures.push('multiple train lines');
        strengths.push(`${station.name}は複数の路線が利用できて便利です`);
      }
    }

    // Analyze commercial features
    if (preferences.commercial > 3) {
      if (features.commercial.shopping >= 4) {
        matchingFeatures.push('excellent shopping');
        strengths.push(`${station.name}周辺にはショッピング施設が充実しています`);
      }
      if (features.commercial.restaurants >= 4) {
        matchingFeatures.push('diverse dining options');
        strengths.push(`${station.name}には多様な飲食店が揃っています`);
      }
      if (features.commercial.convenience >= 4) {
        matchingFeatures.push('convenient daily shopping');
        strengths.push(`${station.name}は日常の買い物に便利な立地です`);
      }
    }

    // Analyze culture features
    if (preferences.culture > 3) {
      if (features.culture.entertainment >= 4) {
        matchingFeatures.push('rich entertainment');
        strengths.push(`${station.name}周辺にはエンターテイメント施設が豊富です`);
      }
      if (features.culture.history >= 4) {
        matchingFeatures.push('historical significance');
        strengths.push(`${station.name}は歴史的な魅力のある地域です`);
      }
      if (features.culture.nightlife >= 4) {
        matchingFeatures.push('vibrant nightlife');
        strengths.push(`${station.name}は活気のあるナイトライフが楽しめます`);
      }
    }

    // Analyze price features
    if (preferences.price > 3) {
      if (features.price.costOfLiving <= 2) {
        matchingFeatures.push('affordable living costs');
        strengths.push(`${station.name}は生活コストが比較的抑えられます`);
      }
      if (features.price.diningCost <= 2) {
        matchingFeatures.push('affordable dining');
        strengths.push(`${station.name}周辺では手頃な価格で食事を楽しめます`);
      }
    }

    // Check priority alignments
    for (const priority of priorities.slice(0, 3)) {
      switch (priority) {
        case 'family-friendly':
          if (features.housing.familyFriendly >= 4) {
            strengths.push(`あなたが重視する「家族向け」の環境が${station.name}には整っています`);
          }
          break;
        case 'quiet':
          if (features.housing.quietness >= 4) {
            strengths.push(`あなたが求める「静かな環境」が${station.name}で見つかります`);
          }
          break;
        case 'affordable':
          if (features.price.costOfLiving <= 2) {
            strengths.push(`あなたが重視する「手頃な価格」の条件を${station.name}が満たしています`);
          }
          break;
        case 'shopping':
          if (features.commercial.shopping >= 4) {
            strengths.push(`あなたが重視する「ショッピング」環境が${station.name}には充実しています`);
          }
          break;
        case 'nightlife':
          if (features.culture.nightlife >= 4) {
            strengths.push(`あなたが求める「ナイトライフ」が${station.name}で楽しめます`);
          }
          break;
      }
    }

    // Add general considerations
    if (matchingFeatures.length === 0) {
      considerations.push(`${station.name}はバランスの取れた地域として推薦されました`);
    }

    return {
      matchingFeatures,
      strengths,
      considerations
    };
  }
}

// Export a singleton instance
export const recommendationService = new RecommendationService();