const User = require('../models/User');
const Notification = require('../models/Notification');
const detectAddressChange = require('../middleware/detectAddressChange');
const mongoose = require('mongoose');

exports.getAllUsers = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      query.role = { $ne: 'admin' };
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, role, phone, department, team } = req.body;

    const currentUserRole = req.user.role;
    const requestedRole = role || 'employee';

    if (currentUserRole === 'manager') {
      if (requestedRole === 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Les managers ne peuvent pas créer des admins'
        });
      }
    } else if (currentUserRole !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Permission refusée. Seuls les admins et managers peuvent créer des utilisateurs'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    const userData = {
      firstname,
      lastname,
      email,
      passwordHash: password,
      role: requestedRole,
      phone: phone || '',
      department: department || 'Non assigné',
      status: 'active',
      profileImage: `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=1976d2&color=fff`
    };

    if (team && mongoose.Types.ObjectId.isValid(team)) {
      userData.team = team;
    }

    const user = await User.create(userData);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, role, active } = req.body;

    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin)
 */
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin)
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/pending
 * @desc    Get pending user registrations
 * @access  Private (Manager/Admin)
 */
exports.getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/validate
 * @desc    Validate/approve pending user registration
 * @access  Private (Manager/Admin)
 */
exports.validateUser = async (req, res, next) => {
  try {
    const { employeeId, department, team } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `User status is ${user.status}, not pending`
      });
    }

    // Update user status and related fields
    user.status = 'active';
    user.active = true;
    user.validatedBy = req.user._id;
    user.validatedAt = new Date();

    if (employeeId) user.employeeId = employeeId;
    if (department) user.department = department;
    if (team) user.team = team;

    await user.save();

    // TODO: Send confirmation email to user

    res.status(200).json({
      status: 'success',
      message: 'User validated successfully. Account is now active.',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/reject
 * @desc    Reject pending user registration
 * @access  Private (Manager/Admin)
 */
exports.rejectUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `User status is ${user.status}, not pending`
      });
    }

    user.status = 'rejected';
    user.active = false;
    user.rejectionReason = reason;
    user.validatedBy = req.user._id;
    user.validatedAt = new Date();

    await user.save();

    // TODO: Send rejection email to user with reason

    res.status(200).json({
      status: 'success',
      message: 'User registration rejected',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/position
 * @desc    Update user position (Manager only)
 * @access  Private (Manager/Admin)
 */
exports.updateUserPosition = async (req, res, next) => {
  try {
    const { position, department, team } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (position) user.position = position;
    if (department) user.department = department;
    if (team) user.team = team;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User position updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me/location
 * @desc    Update current user's location
 * @access  Private (Employee)
 */
exports.updateMyLocation = async (req, res, next) => {
  try {
    const { address, coordinates, busStop } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (address) user.location.address = address;
    if (coordinates) {
      user.location.coordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
    }
    if (busStop) {
      user.location.busStop = {
        name: busStop.name,
        stopId: busStop.stopId
      };
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Private
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const query = {
      $or: [
        { firstname: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      active: true
    };

    // Managers should not see admins
    if (req.user.role === 'manager') {
      query.role = { $ne: 'admin' };
    }

    const users = await User.find(query).limit(20);

    res.status(200).json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/profile
 * @desc    Update user profile (own profile or admin/manager)
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const currentUser = req.user;

    // Vérifier les permissions: l'utilisateur peut modifier son propre profil
    // ou être admin/manager
    if (userId !== currentUser._id.toString() &&
      currentUser.role !== 'admin' &&
      currentUser.role !== 'manager') {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne pouvez modifier que votre propre profil'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Champs modifiables
    const { firstname, lastname, phone, department, position,
      address, city, postalCode, profileImageBase64 } = req.body;

    // Détecter changement d'adresse AVANT la mise à jour
    const addressChangeInfo = detectAddressChange(user, { address, city, postalCode });

    // Mise à jour des champs
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (phone !== undefined) user.phone = phone;
    if (department) user.department = department;
    if (position !== undefined) user.position = position;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (postalCode !== undefined) user.postalCode = postalCode;

    // Gestion de l'image de profil (base64)
    if (profileImageBase64) {
      // On stocke directement le base64 dans profileImage
      // Le frontend envoie déjà le format complet: data:image/png;base64,xxx
      user.profileImage = profileImageBase64;
    }

    await user.save();

    // Si l'adresse a changé, notifier tous les admins
    if (addressChangeInfo.hasChanged) {
      try {
        // Récupérer tous les admins
        const admins = await User.find({ role: 'admin', active: true });
        const adminIds = admins.map(admin => admin._id);

        if (adminIds.length > 0) {
          // Créer la notification
          const notification = await Notification.create({
            title: '📍 Changement d\'adresse',
            message: `${user.firstname} ${user.lastname} a modifié son adresse:\n` +
              `Ancienne: ${addressChangeInfo.oldAddress.address || 'Non renseignée'}, ${addressChangeInfo.oldAddress.city || ''} ${addressChangeInfo.oldAddress.postalCode || ''}\n` +
              `Nouvelle: ${addressChangeInfo.newAddress.address || 'Non renseignée'}, ${addressChangeInfo.newAddress.city || ''} ${addressChangeInfo.newAddress.postalCode || ''}`,
            type: 'address_change',
            metadata: {
              userId: user._id,
              userFullName: `${user.firstname} ${user.lastname}`,
              oldAddress: addressChangeInfo.oldAddress,
              newAddress: addressChangeInfo.newAddress,
              changes: addressChangeInfo.changes
            },
            senderId: user._id,
            targetUsers: adminIds
          });

          console.log(`✅ Notification d'adresse envoyée à ${adminIds.length} admin(s)`);

          // Émettre via Socket.IO si disponible
          const io = req.app.get('io');
          if (io) {
            adminIds.forEach(adminId => {
              io.to(adminId.toString()).emit('notification', {
                type: 'address_change',
                notification: notification
              });
            });
          }
        }
      } catch (notifError) {
        console.error('❌ Erreur lors de la notification des admins:', notifError);
        // Ne pas bloquer la réponse si la notification échoue
      }
    }

    // Prepare user response without null values
    const userResponse = {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      status: user.status,
      active: user.active
    };

    // Only include non-null optional fields
    if (user.phone) userResponse.phone = user.phone;
    if (user.department) userResponse.department = user.department;
    if (user.position) userResponse.position = user.position;
    if (user.address) userResponse.address = user.address;
    if (user.city) userResponse.city = user.city;
    if (user.postalCode) userResponse.postalCode = user.postalCode;
    if (user.profileImage) userResponse.profileImage = user.profileImage;
    if (user.team) userResponse.team = user.team;
    if (user.createdAt) userResponse.createdAt = user.createdAt;
    if (user.updatedAt) userResponse.updatedAt = user.updatedAt;

    res.status(200).json({
      status: 'success',
      message: addressChangeInfo.hasChanged
        ? 'Profil mis à jour avec succès. Les administrateurs ont été notifiés du changement d\'adresse.'
        : 'Profil mis à jour avec succès',
      user: userResponse,
      addressChanged: addressChangeInfo.hasChanged
    });
  } catch (error) {
    next(error);
  }
};
