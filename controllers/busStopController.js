const BusStop = require('../models/BusStop');
const User = require('../models/User');

/**
 * BusStop Controller
 * Handles bus stop management operations
 */

/**
 * @route   GET /api/bus-stops
 * @desc    Get all bus stops
 * @access  Public
 */
exports.getAllBusStops = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const filter = {};
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const busStops = await BusStop.find(filter)
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      count: busStops.length,
      data: busStops
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bus-stops/:id
 * @desc    Get single bus stop by ID
 * @access  Public
 */
exports.getBusStopById = async (req, res, next) => {
  try {
    const busStop = await BusStop.findById(req.params.id);

    if (!busStop) {
      return res.status(404).json({
        status: 'error',
        message: 'Bus stop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: busStop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/bus-stops
 * @desc    Create new bus stop
 * @access  Private (Admin only)
 */
exports.createBusStop = async (req, res, next) => {
  try {
    const {
      name,
      code,
      coordinates,
      address,
      capacity,
      schedule,
      notes
    } = req.body;

    // Check if bus stop with same name exists
    const existingStop = await BusStop.findOne({ name });
    if (existingStop) {
      return res.status(400).json({
        status: 'error',
        message: 'Bus stop with this name already exists'
      });
    }

    const busStop = new BusStop({
      name,
      code,
      coordinates,
      address,
      capacity,
      schedule,
      notes
    });

    await busStop.save();

    res.status(201).json({
      status: 'success',
      message: 'Bus stop created successfully',
      data: busStop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/bus-stops/:id
 * @desc    Update bus stop
 * @access  Private (Admin only)
 */
exports.updateBusStop = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'code', 'coordinates', 'address', 'capacity', 'schedule', 'notes', 'active'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const busStop = await BusStop.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!busStop) {
      return res.status(404).json({
        status: 'error',
        message: 'Bus stop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bus stop updated successfully',
      data: busStop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/bus-stops/:id
 * @desc    Delete bus stop
 * @access  Private (Admin only)
 */
exports.deleteBusStop = async (req, res, next) => {
  try {
    const busStop = await BusStop.findById(req.params.id);

    if (!busStop) {
      return res.status(404).json({
        status: 'error',
        message: 'Bus stop not found'
      });
    }

    // Check if any users are using this bus stop
    const usersCount = await User.countDocuments({ 'location.busStop.stopId': req.params.id });
    
    if (usersCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete bus stop. ${usersCount} employee(s) are using this stop.`,
        usersCount
      });
    }

    await busStop.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Bus stop deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bus-stops/:id/employees
 * @desc    Get employees using a bus stop
 * @access  Private (Manager/Admin)
 */
exports.getBusStopEmployees = async (req, res, next) => {
  try {
    const busStop = await BusStop.findById(req.params.id);

    if (!busStop) {
      return res.status(404).json({
        status: 'error',
        message: 'Bus stop not found'
      });
    }

    const employees = await User.find({
      'location.busStop.stopId': req.params.id,
      active: true
    })
      .select('firstname lastname email position phone location.address')
      .sort({ lastname: 1 });

    res.status(200).json({
      status: 'success',
      busStop: {
        name: busStop.name,
        address: busStop.address
      },
      count: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bus-stops/nearby
 * @desc    Find nearby bus stops based on coordinates
 * @access  Public
 */
exports.getNearbyBusStops = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);

    // Simple distance calculation (not using MongoDB geospatial query)
    const busStops = await BusStop.find({ active: true });

    const nearbyStops = busStops
      .map(stop => {
        const distance = calculateDistance(
          lat,
          lon,
          stop.coordinates.latitude,
          stop.coordinates.longitude
        );
        return { ...stop.toObject(), distance };
      })
      .filter(stop => stop.distance <= radiusInKm)
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      status: 'success',
      count: nearbyStops.length,
      data: nearbyStops
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimals
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
