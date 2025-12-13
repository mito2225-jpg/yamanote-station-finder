import { Station, StationFeatures } from '../types';
import { stationsData } from '../data';

/**
 * Service for managing Yamanote line station data
 * Provides methods to retrieve station information and features
 */
export class StationService {
  private stations: Station[];
  private stationCache: Map<string, Station>;

  constructor() {
    this.stations = stationsData as Station[];
    this.stationCache = new Map();
    this.initializeCache();
  }

  /**
   * Initialize the station cache for faster lookups
   */
  private initializeCache(): void {
    this.stations.forEach(station => {
      this.stationCache.set(station.id, station);
    });
  }

  /**
   * Get all Yamanote line stations
   * @returns Array of all 29 Yamanote stations
   */
  getAllStations(): Station[] {
    return [...this.stations]; // Return a copy to prevent external modification
  }

  /**
   * Get a specific station by its ID
   * @param stationId - The unique identifier of the station
   * @returns The station object if found, null otherwise
   */
  getStationById(stationId: string): Station | null {
    const station = this.stationCache.get(stationId);
    return station ? { ...station } : null; // Return a copy to prevent external modification
  }

  /**
   * Get the features of a specific station
   * @param stationId - The unique identifier of the station
   * @returns The station features if found, null otherwise
   */
  getStationFeatures(stationId: string): StationFeatures | null {
    const station = this.stationCache.get(stationId);
    return station ? { ...station.features } : null; // Return a copy to prevent external modification
  }

  /**
   * Get stations by name (supports both Japanese and English names)
   * @param name - Station name to search for
   * @returns Array of matching stations
   */
  getStationsByName(name: string): Station[] {
    const searchName = name.toLowerCase();
    return this.stations.filter(station => 
      station.name.toLowerCase().includes(searchName) ||
      station.nameEn.toLowerCase().includes(searchName)
    );
  }

  /**
   * Get the total number of stations in the system
   * @returns Number of stations (should be 29 for Yamanote line)
   */
  getStationCount(): number {
    return this.stations.length;
  }

  /**
   * Validate that all required station data is present
   * @returns True if all stations have complete data, false otherwise
   */
  validateStationData(): boolean {
    return this.stations.every(station => {
      return (
        station.id &&
        station.name &&
        station.nameEn &&
        station.location &&
        station.location.latitude &&
        station.location.longitude &&
        station.features &&
        station.description &&
        this.validateStationFeatures(station.features)
      );
    });
  }

  /**
   * Validate that station features contain all required fields
   * @param features - Station features to validate
   * @returns True if features are complete, false otherwise
   */
  private validateStationFeatures(features: StationFeatures): boolean {
    return (
      features.housing &&
      typeof features.housing.rentLevel === 'number' &&
      typeof features.housing.familyFriendly === 'number' &&
      typeof features.housing.quietness === 'number' &&
      features.transport &&
      typeof features.transport.accessibility === 'number' &&
      Array.isArray(features.transport.connections) &&
      typeof features.transport.walkability === 'number' &&
      features.commercial &&
      typeof features.commercial.shopping === 'number' &&
      typeof features.commercial.restaurants === 'number' &&
      typeof features.commercial.convenience === 'number' &&
      features.culture &&
      typeof features.culture.entertainment === 'number' &&
      typeof features.culture.history === 'number' &&
      typeof features.culture.nightlife === 'number' &&
      features.price &&
      typeof features.price.costOfLiving === 'number' &&
      typeof features.price.diningCost === 'number'
    );
  }

  /**
   * Get stations within a certain range of feature values
   * @param category - Feature category to filter by
   * @param minValue - Minimum value for the feature
   * @param maxValue - Maximum value for the feature
   * @returns Array of stations matching the criteria
   */
  getStationsByFeatureRange(
    category: keyof StationFeatures,
    subcategory: string,
    minValue: number,
    maxValue: number
  ): Station[] {
    return this.stations.filter(station => {
      const featureValue = (station.features[category] as any)[subcategory];
      return typeof featureValue === 'number' && 
             featureValue >= minValue && 
             featureValue <= maxValue;
    });
  }
}

// Export a singleton instance
export const stationService = new StationService();