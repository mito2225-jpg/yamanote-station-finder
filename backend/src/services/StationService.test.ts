import { StationService, stationService } from './StationService';

describe('StationService', () => {
  let service: StationService;

  beforeEach(() => {
    service = new StationService();
  });

  describe('getAllStations', () => {
    it('should return all Yamanote stations', () => {
      const stations = service.getAllStations();
      expect(stations).toHaveLength(28);
    });

    it('should return stations with required properties', () => {
      const stations = service.getAllStations();
      const firstStation = stations[0];
      
      expect(firstStation).toHaveProperty('id');
      expect(firstStation).toHaveProperty('name');
      expect(firstStation).toHaveProperty('nameEn');
      expect(firstStation).toHaveProperty('location');
      expect(firstStation).toHaveProperty('features');
      expect(firstStation).toHaveProperty('description');
    });

    it('should return a copy of stations array to prevent external modification', () => {
      const stations1 = service.getAllStations();
      const stations2 = service.getAllStations();
      
      expect(stations1).not.toBe(stations2); // Different array instances
      expect(stations1).toEqual(stations2); // Same content
    });

    it('should return stations with complete location data', () => {
      const stations = service.getAllStations();
      
      stations.forEach(station => {
        expect(station.location).toBeDefined();
        expect(typeof station.location.latitude).toBe('number');
        expect(typeof station.location.longitude).toBe('number');
        expect(station.location.latitude).toBeGreaterThan(0);
        expect(station.location.longitude).toBeGreaterThan(0);
      });
    });

    it('should return stations with complete feature data structure', () => {
      const stations = service.getAllStations();
      
      stations.forEach(station => {
        const { features } = station;
        
        // Housing features
        expect(features.housing).toBeDefined();
        expect(typeof features.housing.rentLevel).toBe('number');
        expect(typeof features.housing.familyFriendly).toBe('number');
        expect(typeof features.housing.quietness).toBe('number');
        
        // Transport features
        expect(features.transport).toBeDefined();
        expect(typeof features.transport.accessibility).toBe('number');
        expect(Array.isArray(features.transport.connections)).toBe(true);
        expect(typeof features.transport.walkability).toBe('number');
        
        // Commercial features
        expect(features.commercial).toBeDefined();
        expect(typeof features.commercial.shopping).toBe('number');
        expect(typeof features.commercial.restaurants).toBe('number');
        expect(typeof features.commercial.convenience).toBe('number');
        
        // Culture features
        expect(features.culture).toBeDefined();
        expect(typeof features.culture.entertainment).toBe('number');
        expect(typeof features.culture.history).toBe('number');
        expect(typeof features.culture.nightlife).toBe('number');
        
        // Price features
        expect(features.price).toBeDefined();
        expect(typeof features.price.costOfLiving).toBe('number');
        expect(typeof features.price.diningCost).toBe('number');
      });
    });
  });

  describe('getStationById', () => {
    it('should return station when valid ID is provided', () => {
      const station = service.getStationById('shimbashi');
      
      expect(station).not.toBeNull();
      expect(station?.id).toBe('shimbashi');
      expect(station?.name).toBe('新橋');
      expect(station?.nameEn).toBe('Shimbashi');
    });

    it('should return null when invalid ID is provided', () => {
      const station = service.getStationById('invalid-id');
      expect(station).toBeNull();
    });
  });

  describe('getStationFeatures', () => {
    it('should return features when valid ID is provided', () => {
      const features = service.getStationFeatures('shibuya');
      
      expect(features).not.toBeNull();
      expect(features).toHaveProperty('housing');
      expect(features).toHaveProperty('transport');
      expect(features).toHaveProperty('commercial');
      expect(features).toHaveProperty('culture');
      expect(features).toHaveProperty('price');
    });

    it('should return null when invalid ID is provided', () => {
      const features = service.getStationFeatures('invalid-id');
      expect(features).toBeNull();
    });
  });

  describe('getStationCount', () => {
    it('should return correct count for Yamanote line', () => {
      const count = service.getStationCount();
      expect(count).toBe(28);
    });
  });

  describe('validateStationData', () => {
    it('should validate that all station data is complete', () => {
      const isValid = service.validateStationData();
      expect(isValid).toBe(true);
    });

    it('should validate that all stations have unique IDs', () => {
      const stations = service.getAllStations();
      const stationIds = stations.map(station => station.id);
      const uniqueIds = new Set(stationIds);
      
      expect(uniqueIds.size).toBe(28);
      expect(stationIds.length).toBe(28);
    });

    it('should validate that all stations have non-empty names', () => {
      const stations = service.getAllStations();
      
      stations.forEach(station => {
        expect(station.name).toBeTruthy();
        expect(station.name.length).toBeGreaterThan(0);
        expect(station.nameEn).toBeTruthy();
        expect(station.nameEn.length).toBeGreaterThan(0);
      });
    });

    it('should validate that all stations have descriptions', () => {
      const stations = service.getAllStations();
      
      stations.forEach(station => {
        expect(station.description).toBeTruthy();
        expect(station.description.length).toBeGreaterThan(0);
      });
    });

    it('should validate that feature values are within reasonable ranges', () => {
      const stations = service.getAllStations();
      
      stations.forEach(station => {
        const { features } = station;
        
        // All numeric features should be between 1-5 (typical rating scale)
        expect(features.housing.rentLevel).toBeGreaterThanOrEqual(1);
        expect(features.housing.rentLevel).toBeLessThanOrEqual(5);
        expect(features.housing.familyFriendly).toBeGreaterThanOrEqual(1);
        expect(features.housing.familyFriendly).toBeLessThanOrEqual(5);
        expect(features.housing.quietness).toBeGreaterThanOrEqual(1);
        expect(features.housing.quietness).toBeLessThanOrEqual(5);
        
        expect(features.transport.accessibility).toBeGreaterThanOrEqual(1);
        expect(features.transport.accessibility).toBeLessThanOrEqual(5);
        expect(features.transport.walkability).toBeGreaterThanOrEqual(1);
        expect(features.transport.walkability).toBeLessThanOrEqual(5);
        
        expect(features.commercial.shopping).toBeGreaterThanOrEqual(1);
        expect(features.commercial.shopping).toBeLessThanOrEqual(5);
        expect(features.commercial.restaurants).toBeGreaterThanOrEqual(1);
        expect(features.commercial.restaurants).toBeLessThanOrEqual(5);
        expect(features.commercial.convenience).toBeGreaterThanOrEqual(1);
        expect(features.commercial.convenience).toBeLessThanOrEqual(5);
        
        expect(features.culture.entertainment).toBeGreaterThanOrEqual(1);
        expect(features.culture.entertainment).toBeLessThanOrEqual(5);
        expect(features.culture.history).toBeGreaterThanOrEqual(1);
        expect(features.culture.history).toBeLessThanOrEqual(5);
        expect(features.culture.nightlife).toBeGreaterThanOrEqual(1);
        expect(features.culture.nightlife).toBeLessThanOrEqual(5);
        
        expect(features.price.costOfLiving).toBeGreaterThanOrEqual(1);
        expect(features.price.costOfLiving).toBeLessThanOrEqual(5);
        expect(features.price.diningCost).toBeGreaterThanOrEqual(1);
        expect(features.price.diningCost).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('getStationsByName', () => {
    it('should find stations by Japanese name', () => {
      const stations = service.getStationsByName('新橋');
      expect(stations).toHaveLength(1);
      expect(stations[0].name).toBe('新橋');
    });

    it('should find stations by English name', () => {
      const stations = service.getStationsByName('Shibuya');
      expect(stations).toHaveLength(1);
      expect(stations[0].nameEn).toBe('Shibuya');
    });

    it('should be case insensitive', () => {
      const stations = service.getStationsByName('shibuya');
      expect(stations).toHaveLength(1);
      expect(stations[0].nameEn).toBe('Shibuya');
    });

    it('should return empty array for non-existent station', () => {
      const stations = service.getStationsByName('NonExistent');
      expect(stations).toHaveLength(0);
    });
  });

  describe('getStationsByFeatureRange', () => {
    it('should filter stations by feature range', () => {
      const highAccessibilityStations = service.getStationsByFeatureRange('transport', 'accessibility', 4, 5);
      expect(highAccessibilityStations.length).toBeGreaterThan(0);
      
      highAccessibilityStations.forEach(station => {
        expect(station.features.transport.accessibility).toBeGreaterThanOrEqual(4);
        expect(station.features.transport.accessibility).toBeLessThanOrEqual(5);
      });
    });

    it('should return empty array when no stations match criteria', () => {
      const stations = service.getStationsByFeatureRange('housing', 'rentLevel', 10, 15);
      expect(stations).toHaveLength(0);
    });
  });

  describe('singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(stationService).toBeInstanceOf(StationService);
      expect(stationService.getStationCount()).toBe(28);
    });
  });

  describe('data integrity', () => {
    it('should verify all expected Yamanote line stations are present', () => {
      const stations = service.getAllStations();
      const stationNames = stations.map(s => s.nameEn.toLowerCase());
      
      // Key Yamanote line stations that should be present
      const expectedStations = [
        'tokyo', 'shimbashi', 'shinagawa', 'shibuya', 'shinjuku', 
        'ikebukuro', 'ueno', 'akihabara', 'yurakucho', 'harajuku'
      ];
      
      expectedStations.forEach(expectedStation => {
        expect(stationNames).toContain(expectedStation);
      });
    });

    it('should ensure station data is immutable when retrieved', () => {
      const station1 = service.getStationById('shibuya');
      const station2 = service.getStationById('shibuya');
      
      expect(station1).not.toBe(station2); // Different object instances
      expect(station1).toEqual(station2); // Same content
      
      // Modifying one shouldn't affect the other
      if (station1) {
        station1.name = 'Modified';
        expect(station2?.name).not.toBe('Modified');
      }
    });
  });
});