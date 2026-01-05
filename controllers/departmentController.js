const Department = require('../models/Department');
const Team = require('../models/Team');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
exports.getDepartments = catchAsync(async (req, res, next) => {
  const { isActive } = req.query;
  
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const departments = await Department.find(filter)
    .populate('manager', 'firstname lastname email role')
    .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: departments.length,
    data: departments
  });
});

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
exports.getDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('manager', 'firstname lastname email role')
    .populate('teams');

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: department
  });
});

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Private (Admin only)
 */
exports.createDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, location, budget, color } = req.body;

  // Validate manager exists
  const managerUser = await User.findById(manager);
  if (!managerUser) {
    return next(new AppError('Manager not found', 404));
  }

  const department = await Department.create({
    name,
    description,
    manager,
    location,
    budget,
    color,
    createdBy: req.user._id
  });

  await department.populate('manager', 'firstname lastname email role');

  res.status(201).json({
    status: 'success',
    data: department
  });
});

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (Admin, Manager)
 */
exports.updateDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, location, budget, color, isActive, employeeCount } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Update fields
  if (name) department.name = name;
  if (description !== undefined) department.description = description;
  if (manager) {
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return next(new AppError('Manager not found', 404));
    }
    department.manager = manager;
  }
  if (location !== undefined) department.location = location;
  if (budget !== undefined) department.budget = budget;
  if (color) department.color = color;
  if (isActive !== undefined) department.isActive = isActive;
  if (employeeCount !== undefined) department.employeeCount = employeeCount;
  
  department.updatedBy = req.user._id;
  await department.save();

  await department.populate('manager', 'firstname lastname email role');

  res.status(200).json({
    status: 'success',
    data: department
  });
});

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department (soft delete)
 * @access  Private (Admin only)
 */
exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Check if department has active teams
  const activeTeams = await Team.countDocuments({
    department: department._id,
    isActive: true
  });

  if (activeTeams > 0) {
    return next(new AppError(`Cannot delete department with ${activeTeams} active team(s)`, 400));
  }

  department.isActive = false;
  department.updatedBy = req.user._id;
  await department.save();

  res.status(200).json({
    status: 'success',
    message: 'Department deleted successfully'
  });
});

/**
 * @route   GET /api/departments/:id/teams
 * @desc    Get all teams in a department
 * @access  Private
 */
exports.getDepartmentTeams = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  const teams = await Team.find({
    department: req.params.id,
    isActive: true
  })
    .populate('leader', 'firstname lastname email')
    .populate('members', 'firstname lastname email');

  res.status(200).json({
    status: 'success',
    results: teams.length,
    data: teams
  });
});

/**
 * @route   GET /api/departments/:id/stats
 * @desc    Get department statistics
 * @access  Private
 */
exports.getDepartmentStats = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  const teams = await Team.find({
    department: req.params.id,
    isActive: true
  }).populate('members');

  const totalTeams = teams.length;
  const totalEmployees = teams.reduce((sum, team) => sum + team.members.length, 0);
  const avgTeamSize = totalTeams > 0 ? (totalEmployees / totalTeams).toFixed(1) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      department: {
        id: department._id,
        name: department.name,
        manager: department.manager
      },
      stats: {
        totalTeams,
        totalEmployees,
        avgTeamSize: parseFloat(avgTeamSize),
        budget: department.budget
      }
    }
  });
});
