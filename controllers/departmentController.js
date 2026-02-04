const Department = require('../models/Department');
const Team = require('../models/Team');
const User = require('../models/User');
const Group = require('../models/Group');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


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


exports.createDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, location, budget, color, code } = req.body;

  const managerUser = await User.findById(manager);
  if (!managerUser) {
    return next(new AppError('Manager not found', 404));
  }

  const department = await Department.create({
    name,
    code,
    description,
    manager,
    location,
    budget,
    color,
    createdBy: req.user._id
  });

  try {
    const groupChat = await Group.create({
      name: `${name} - Chat`,
      description: `Groupe de chat du département ${name}`,
      type: 'department',
      department: name,
      members: [manager, req.user._id], // Add manager and creator as initial members
      admins: [manager, req.user._id], // Manager and creator are admins
      createdBy: req.user._id,
      isActive: true
    });

    department.chatRoomId = groupChat._id;
    await department.save();

    console.log(`✅ Auto-created group chat ${groupChat._id} for department ${name}`);
  } catch (groupError) {
    console.error('❌ Failed to create group chat:', groupError);
  }

  await department.populate('manager', 'firstname lastname email role');

  res.status(201).json({
    status: 'success',
    data: department,
    message: 'Department and group chat created successfully'
  });
});


exports.updateDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, location, budget, color, isActive, employeeCount } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

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


exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  const activeTeams = await Team.countDocuments({
    department: department._id,
    isActive: true
  });

  if (activeTeams > 0) {
    return next(new AppError(`Cannot delete department with ${activeTeams} active team(s)`, 400));
  }

  if (department.chatRoomId) {
    try {
      await Group.findByIdAndUpdate(department.chatRoomId, {
        isActive: false,
        updatedAt: new Date()
      });
      console.log(`✅ Deactivated group chat ${department.chatRoomId} for department ${department.name}`);
    } catch (groupError) {
      console.error('❌ Failed to deactivate group chat:', groupError);
    }
  }

  department.isActive = false;
  department.updatedBy = req.user._id;
  await department.save();

  res.status(200).json({
    status: 'success',
    message: 'Department and associated group chat deleted successfully'
  });
});


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


exports.getDepartmentGroup = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  if (!department.chatRoomId) {
    return next(new AppError('This department does not have a group chat', 404));
  }

  const groupChat = await Group.findById(department.chatRoomId)
    .populate('members', 'firstname lastname email profileImage')
    .populate('admins', 'firstname lastname email')
    .populate('createdBy', 'firstname lastname email');

  if (!groupChat) {
    return next(new AppError('Group chat not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: groupChat
  });
});
