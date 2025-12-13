import { Router, Request, Response } from 'express';
import { stationService } from '../services/StationService';

const router = Router();

/**
 * GET /api/stations
 * Get all Yamanote line stations
 * Query parameters:
 * - name: Filter stations by name (optional)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    
    let stations;
    if (name && typeof name === 'string') {
      stations = stationService.getStationsByName(name);
    } else {
      stations = stationService.getAllStations();
    }
    
    res.json({
      success: true,
      data: {
        stations,
        count: stations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stations/:id
 * Get a specific station by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = stationService.getStationById(id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found',
        message: `Station with ID '${id}' does not exist`
      });
    }
    
    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve station',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stations/:id/features
 * Get features for a specific station
 */
router.get('/:id/features', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const features = stationService.getStationFeatures(id);
    
    if (!features) {
      return res.status(404).json({
        success: false,
        error: 'Station not found',
        message: `Station with ID '${id}' does not exist`
      });
    }
    
    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve station features',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stations/validate/data
 * Validate that all station data is complete
 */
router.get('/validate/data', (req: Request, res: Response) => {
  try {
    const isValid = stationService.validateStationData();
    const stationCount = stationService.getStationCount();
    
    res.json({
      success: true,
      data: {
        isValid,
        stationCount,
        expectedCount: 29,
        isComplete: stationCount === 29 && isValid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate station data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;