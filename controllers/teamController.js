const Team = require('../models/Team');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getTeams = catchAsync(async (req, res, next) => {
  const { isActive, department } = req.query;

  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  if (department) {
    filter.department = department;
  }

  const teams = await Team.find(filter)
    .populate('department', 'name description')
    .populate('leader', 'firstname lastname email role')
    .populate('members', 'firstname lastname email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: teams.length,
    data: teams
  });
});

exports.getTeam = catchAsync(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('department', 'name description')
    .populate('leader', 'firstname lastname email role')
    .populate('members', 'firstname lastname email role');

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: team
  });
});

exports.createTeam = catchAsync(async (req, res, next) => {
  const { name, description, department, leader, members, color } = req.body;

  const leaderUser = await User.findById(leader);
  if (!leaderUser) {
    return next(new AppError('Team leader not found', 404));
  }

  if (members && members.length > 0) {
    const memberUsers = await User.find({ _id: { $in: members } });
    if (memberUsers.length !== members.length) {
      return next(new AppError('One or more members not found', 404));
    }
  }

  const team = await Team.create({
    name,
    description,
    department,
    leader,
    members: members || [],
    color,
    createdBy: req.user._id
  });

  await team.populate(['department', 'leader', 'members']);

  res.status(201).json({
    status: 'success',
    data: team
  });
});

exports.updateTeam = catchAsync(async (req, res, next) => {
  const { name, description, department, leader, members, color, isActive } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (department) team.department = department;
  if (leader) {
    const leaderUser = await User.findById(leader);
    if (!leaderUser) {
      return next(new AppError('Team leader not found', 404));
    }
    team.leader = leader;
  }
  if (members !== undefined) {
    if (members.length > 0) {
      const memberUsers = await User.find({ _id: { $in: members } });
      if (memberUsers.length !== members.length) {
        return next(new AppError('One or more members not found', 404));
      }
    }
    team.members = members;
  }
  if (color) team.color = color;
  if (isActive !== undefined) team.isActive = isActive;

  team.updatedBy = req.user._id;
  await team.save();

  await team.populate(['department', 'leader', 'members']);

  res.status(200).json({
    status: 'success',
    data: team
  });
});

exports.deleteTeam = catchAsync(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  team.isActive = false;
  team.updatedBy = req.user._id;
  await team.save();

  res.status(200).json({
    status: 'success',
    message: 'Team deleted successfully'
  });
});

/**
 * @route   POST /api/teams/:id/members
 * @desc    Add member to team
 * @access  Private (Admin, Manager, Team Leader)
 */
exports.addMember = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if already a member
  if (team.isMember(userId)) {
    return next(new AppError('User is already a team member', 400));
  }

  await team.addMember(userId);
  await team.populate('members', 'firstname lastname email role');

  res.status(200).json({
    status: 'success',
    data: team
  });
});

/**
 * @route   DELETE /api/teams/:id/members/:userId
 * @desc    Remove member from team
 * @access  Private (Admin, Manager, Team Leader)
 */
exports.removeMember = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Cannot remove team leader
  if (team.isLeader(userId)) {
    return next(new AppError('Cannot remove team leader. Assign a new leader first.', 400));
  }

  // Check if user is a member
  if (!team.isMember(userId)) {
    return next(new AppError('User is not a team member', 400));
  }

  await team.removeMember(userId);
  await team.populate('members', 'firstname lastname email role');

  res.status(200).json({
    status: 'success',
    data: team
  });
});

/**
 * @route   GET /api/teams/:id/members
 * @desc    Get all team members
 * @access  Private
 */
exports.getTeamMembers = catchAsync(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('members', 'firstname lastname email role active');

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: team.members.length,
    data: team.members
  });
});
