import { stationService } from './services/StationService';

// Simple verification script to test StationService functionality
console.log('=== Station Service Verification ===');

// Test 1: Check total station count
const totalStations = stationService.getStationCount();
console.log(`✓ Total stations: ${totalStations} (expected: 29)`);

// Test 2: Get all stations
const allStations = stationService.getAllStations();
console.log(`✓ getAllStations() returned ${allStations.length} stations`);

// Test 3: Test specific station retrieval
const shibuya = stationService.getStationById('shibuya');
console.log(`✓ Shibuya station: ${shibuya?.name} (${shibuya?.nameEn})`);

// Test 4: Test station features
const shibuyaFeatures = stationService.getStationFeatures('shibuya');
console.log(`✓ Shibuya transport accessibility: ${shibuyaFeatures?.transport.accessibility}`);

// Test 5: Test invalid station
const invalidStation = stationService.getStationById('invalid');
console.log(`✓ Invalid station returns: ${invalidStation}`);

// Test 6: Validate all station data
const isDataValid = stationService.validateStationData();
console.log(`✓ Station data validation: ${isDataValid ? 'PASSED' : 'FAILED'}`);

// Test 7: List some key stations
const keyStations = ['tokyo', 'shinjuku', 'shibuya', 'ikebukuro', 'ueno'];
console.log('\n=== Key Stations ===');
keyStations.forEach(stationId => {
  const station = stationService.getStationById(stationId);
  if (station) {
    console.log(`${station.name} (${station.nameEn}) - Transport: ${station.features.transport.accessibility}/5`);
  }
});

console.log('\n=== Verification Complete ===');