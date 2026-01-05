const Objective = require('../models/Objective');
const User = require('../models/User');

/**
 * @route   GET /api/objectives/stats
 * @desc    Get objectives statistics for manager/admin
 * @access  Private (Manager/Admin)
 */
exports.getObjectiveStats = async (req, res, next) => {
    try {
        // Get all objectives for this manager or all if admin
        const filter = req.user.role === 'admin'
            ? {}
            : { assignedBy: req.user._id };

        const objectives = await Objective.find(filter);

        // Calculate statistics
        const stats = {
            total: objectives.length,
            byStatus: {
                todo: objectives.filter(o => o.status === 'todo').length,
                in_progress: objectives.filter(o => o.status === 'in_progress').length,
                completed: objectives.filter(o => o.status === 'completed').length,
                blocked: objectives.filter(o => o.status === 'blocked').length,
            },
            byPriority: {
                low: objectives.filter(o => o.priority === 'low').length,
                medium: objectives.filter(o => o.priority === 'medium').length,
                high: objectives.filter(o => o.priority === 'high').length,
                urgent: objectives.filter(o => o.priority === 'urgent').length,
            },
            overdue: objectives.filter(o =>
                new Date(o.dueDate) < new Date() && o.status !== 'completed'
            ).length,
            averageProgress: objectives.length > 0
                ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
                : 0,
        };

        res.status(200).json({
            status: 'success',
            stats: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/objectives/bulk-update
 * @desc    Update multiple objectives at once
 * @access  Private (Manager/Admin)
 */
exports.bulkUpdateObjectives = async (req, res, next) => {
    try {
        const { objectiveIds, updates } = req.body;

        if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'objectiveIds array is required'
            });
        }

        // Update all objectives
        const result = await Objective.updateMany(
            { _id: { $in: objectiveIds } },
            { $set: updates }
        );

        res.status(200).json({
            status: 'success',
            message: `${result.modifiedCount} objectives updated`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/objectives/bulk-delete
 * @desc    Delete multiple objectives at once
 * @access  Private (Manager/Admin)
 */
exports.bulkDeleteObjectives = async (req, res, next) => {
    try {
        const { objectiveIds } = req.body;

        if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'objectiveIds array is required'
            });
        }

        const result = await Objective.deleteMany({
            _id: { $in: objectiveIds }
        });

        res.status(200).json({
            status: 'success',
            message: `${result.deletedCount} objectives deleted`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        next(error);
    }
};
