const Objective = require('../models/Objective');
const User = require('../models/User');

exports.getMyObjectives = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    const filter = { assignedTo: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const objectives = await Objective.find(filter)
      .populate('assignedBy', 'firstname lastname email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('comments.userId', 'firstname lastname')
      .sort({ priority: -1, dueDate: 1 });

    res.status(200).json({
      status: 'success',
      count: objectives.length,
      objectives: objectives
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeamObjectives = async (req, res, next) => {
  try {
    const { teamId, status, priority } = req.query;

    const filter = {};

    if (teamId) {
      filter.team = teamId;
    } else {
      filter.assignedBy = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const objectives = await Objective.find(filter)
      .populate('assignedTo', 'firstname lastname email position')
      .populate('assignedBy', 'firstname lastname')
      .populate('team', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json({
      status: 'success',
      count: objectives.length,
      objectives: objectives
    });
  } catch (error) {
    next(error);
  }
};

exports.createObjective = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        status: 'error',
        message: 'Seuls les admins et managers peuvent créer des objectifs'
      });
    }

    const {
      title,
      description,
      assignedTo,
      team,
      department,
      priority,
      startDate,
      dueDate,
      links
    } = req.body;

    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Assigned user not found'
      });
    }

    const objective = new Objective({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      team,
      department,
      priority: priority || 'medium',
      startDate,
      dueDate,
      links
    });

    await objective.save();

    await objective.populate('assignedTo', 'firstname lastname email role');
    await objective.populate('assignedBy', 'firstname lastname role');

    const Notification = require('../models/Notification');
    try {
      await Notification.create({
        title: 'Nouvel Objectif Assigné',
        message: `Vous avez un nouvel objectif: "${title}". Priorité: ${priority || 'medium'}`,
        senderId: req.user._id,
        targetUsers: [assignedTo],
        readBy: []
      });

      if (req.app.get('io')) {
        req.app.get('io').to(assignedTo.toString()).emit('newNotification', {
          title: 'Nouvel Objectif Assigné',
          message: `Vous avez un nouvel objectif: "${title}"`
        });
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Objective created successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

exports.getObjectiveById = async (req, res, next) => {
  try {
    const objective = await Objective.findById(req.params.id)
      .populate('assignedTo', 'firstname lastname email position')
      .populate('assignedBy', 'firstname lastname email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('comments.userId', 'firstname lastname')
      .populate('files.uploadedBy', 'firstname lastname');

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    const isAssigned = objective.assignedTo._id.toString() === req.user._id.toString();
    const isAssigner = objective.assignedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAssigner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this objective'
      });
    }

    res.status(200).json({
      status: 'success',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/objectives/:id/status
 * @desc    Update objective status
 * @access  Private (Assigned user or Manager)
 */
exports.updateObjectiveStatus = async (req, res, next) => {
  try {
    const { status, blockReason } = req.body;

    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    // Check authorization
    const isAssigned = objective.assignedTo.toString() === req.user._id.toString();
    const isAssigner = objective.assignedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAssigner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this objective'
      });
    }

    objective.status = status;

    if (status === 'blocked' && blockReason) {
      objective.blockReason = blockReason;
    } else if (status !== 'blocked') {
      objective.blockReason = undefined;
    }

    await objective.save();

    res.status(200).json({
      status: 'success',
      message: 'Status updated successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/objectives/:id/progress
 * @desc    Update objective progress
 * @access  Private (Assigned user)
 */
exports.updateObjectiveProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;

    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    // Only assigned user can update progress
    if (objective.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only assigned user can update progress'
      });
    }

    objective.progress = progress;

    // Auto-complete if progress reaches 100%
    if (progress >= 100 && objective.status !== 'completed') {
      objective.status = 'completed';
    }

    await objective.save();

    res.status(200).json({
      status: 'success',
      message: 'Progress updated successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/objectives/:id/comments
 * @desc    Add comment to objective
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    objective.comments.push({
      userId: req.user._id,
      text,
      createdAt: new Date()
    });

    await objective.save();
    await objective.populate('comments.userId', 'firstname lastname');

    res.status(200).json({
      status: 'success',
      message: 'Comment added successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/objectives/:id/files
 * @desc    Add file to objective (URL only, actual upload handled separately)
 * @access  Private
 */
exports.addFile = async (req, res, next) => {
  try {
    const { filename, url, size } = req.body;

    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    objective.files.push({
      filename,
      url,
      size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await objective.save();

    res.status(200).json({
      status: 'success',
      message: 'File added successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/objectives/:id
 * @desc    Update objective details
 * @access  Private (Manager/Admin)
 */
exports.updateObjective = async (req, res, next) => {
  try {
    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    // Check authorization
    const isAssigner = objective.assignedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this objective'
      });
    }

    const allowedFields = ['title', 'description', 'priority', 'dueDate', 'notes', 'links'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        objective[field] = req.body[field];
      }
    });

    await objective.save();

    res.status(200).json({
      status: 'success',
      message: 'Objective updated successfully',
      data: objective
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/objectives/:id
 * @desc    Delete objective
 * @access  Private (Manager/Admin)
 */
exports.deleteObjective = async (req, res, next) => {
  try {
    const objective = await Objective.findById(req.params.id);

    if (!objective) {
      return res.status(404).json({
        status: 'error',
        message: 'Objective not found'
      });
    }

    // Check authorization
    const isAssigner = objective.assignedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this objective'
      });
    }

    await objective.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Objective deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
