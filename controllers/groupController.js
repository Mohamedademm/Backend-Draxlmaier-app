const ChatGroup = require('../models/ChatGroup');

/**
 * Group Controller
 * Handles chat group operations
 */

/**
 * @route   GET /api/groups
 * @desc    Get all groups for current user
 * @access  Private
 */
exports.getAllGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const groups = await ChatGroup.find({ members: userId })
      .populate('members', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: groups.length,
      groups
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await ChatGroup.findById(req.params.id)
      .populate('members', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email');

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group'
      });
    }

    res.status(200).json({
      status: 'success',
      group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups
 * @desc    Create new group
 * @access  Private
 */
exports.createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    const userId = req.user._id;

    // Add creator to members if not already included
    const memberSet = new Set([...members, userId.toString()]);

    const group = await ChatGroup.create({
      name,
      members: Array.from(memberSet),
      createdBy: userId
    });

    const populatedGroup = await ChatGroup.findById(group._id)
      .populate('members', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email');

    res.status(201).json({
      status: 'success',
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add members to group
 * @access  Private
 */
exports.addMembers = async (req, res, next) => {
  try {
    const { members } = req.body;

    const group = await ChatGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is a member or creator
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to add members'
      });
    }

    // Add new members
    const newMembers = members.filter(m => !group.members.includes(m));
    group.members.push(...newMembers);
    await group.save();

    const updatedGroup = await ChatGroup.findById(group._id)
      .populate('members', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email');

    res.status(200).json({
      status: 'success',
      message: 'Members added successfully',
      group: updatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id/members/:memberId
 * @desc    Remove member from group
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const group = await ChatGroup.findById(id);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only group creator can remove members'
      });
    }

    // Remove member
    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();

    const updatedGroup = await ChatGroup.findById(group._id)
      .populate('members', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email');

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
      group: updatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/department
 * @desc    Get or create department group for current user
 * @access  Private
 */
exports.getDepartmentGroup = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get current user to find their department
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user.department) {
      return res.status(400).json({
        status: 'error',
        message: 'User does not have a department assigned'
      });
    }

    // Find or create department group
    const group = await ChatGroup.findOrCreateDepartmentGroup(user.department);

    // Ensure current user is a member
    if (!group.isMember(userId)) {
      await group.addMember(userId);
    }

    // If user is a manager and not already an admin, make them admin
    if (user.role === 'manager' && !group.isAdmin(userId)) {
      group.admins.push(userId);
      await group.save();
    }

    const populatedGroup = await ChatGroup.findById(group._id)
      .populate('members', 'firstname lastname email role department')
      .populate('admins', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname');

    res.status(200).json({
      status: 'success',
      group: populatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/department/all
 * @desc    Get all department groups (filtered by user role)
 * @access  Private
 */
exports.getAllDepartmentGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const User = require('../models/User');
    const user = await User.findById(userId);

    let query = { type: 'department' };

    // If not admin, filter by user's department
    if (user.role !== 'admin') {
      if (!user.department) {
        return res.status(400).json({
          status: 'error',
          message: 'User does not have a department assigned'
        });
      }
      query.department = user.department;
    }

    const groups = await ChatGroup.find(query)
      .populate('members', 'firstname lastname email role department')
      .populate('admins', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname')
      .sort({ department: 1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: groups.length,
      groups
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/department/create
 * @desc    Create a department group (admin only)
 * @access  Private (Admin)
 */
exports.createDepartmentGroup = async (req, res, next) => {
  try {
    const { name, department, description } = req.body;
    const userId = req.user._id;
    const User = require('../models/User');
    const user = await User.findById(userId);

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can create department groups'
      });
    }

    // Validate department - Allow predefined departments or custom ones
    const allowedDepartments = [
      'Qualité',
      'Logistique',
      'MM shift A',
      'MM shift B',
      'SZB shift A',
      'SZB shift B'
    ];

    // If department is not in the predefined list, it's a custom department - allow it
    const isCustomDepartment = !allowedDepartments.includes(department);

    // Validate that department name is provided and not empty
    if (!department || department.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Department name is required'
      });
    }

    // Check if department group already exists
    const existingGroup = await ChatGroup.findOne({
      type: 'department',
      department: department
    });

    if (existingGroup) {
      return res.status(400).json({
        status: 'error',
        message: 'A group for this department already exists'
      });
    }

    // Get all users from this department
    // For custom departments, start with empty members (admin will add later)
    // For predefined departments, auto-add all department users
    let memberIds = [userId]; // Always include the creator (admin)

    if (!isCustomDepartment) {
      // Only auto-add users for predefined departments
      const departmentUsers = await User.find({
        department: department,
        active: true
      }).select('_id');

      const departmentUserIds = departmentUsers.map(u => u._id.toString());

      // Merge with creator, avoiding duplicates
      memberIds = [...new Set([userId.toString(), ...departmentUserIds])];
    }

    // Create the group
    const group = await ChatGroup.create({
      name: name || `Groupe ${department}`,
      description: description || `Chat de groupe pour le département ${department}`,
      department: department,
      type: 'department',
      members: memberIds,
      admins: [userId],
      createdBy: userId,
      isActive: true
    });

    const populatedGroup = await ChatGroup.findById(group._id)
      .populate('members', 'firstname lastname email role department')
      .populate('admins', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname');

    res.status(201).json({
      status: 'success',
      message: 'Department group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete group
 * @access  Private (Admin or Creator)
 */
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await ChatGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is creator or admin
    if (group.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this group'
      });
    }

    await ChatGroup.findByIdAndDelete(req.params.id);

    // Optional: Delete messages associated with this group
    // const Message = require('../models/Message');
    // await Message.deleteMany({ group: req.params.id });

    res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id/messages
 * @desc    Clear all messages in a group
 * @access  Private (Admin or Creator)
 */
exports.clearMessages = async (req, res, next) => {
  try {
    const group = await ChatGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is creator or admin
    if (group.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to clear messages for this group'
      });
    }

    // Assuming you have a Message model, you would delete messages here.
    // We need to import the Message model if we want to use it.
    const Message = require('../models/Message');
    await Message.deleteMany({ groupId: req.params.id });

    res.status(200).json({
      status: 'success',
      message: 'Messages cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
