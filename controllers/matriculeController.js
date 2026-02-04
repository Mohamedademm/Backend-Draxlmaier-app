const EmployeeMatricule = require('../models/EmployeeMatricule');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createMatricule = catchAsync(async (req, res, next) => {
  const { matricule, nom, prenom, poste, department } = req.body;

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé. Seuls les admins et managers peuvent créer des matricules', 403));
  }

  const existingMatricule = await EmployeeMatricule.findOne({ matricule: matricule.toUpperCase() });
  if (existingMatricule) {
    return next(new AppError('Ce matricule existe déjà', 400));
  }

  const newMatricule = await EmployeeMatricule.create({
    matricule: matricule.toUpperCase(),
    nom,
    prenom,
    poste,
    department,
    createdBy: req.user._id
  });

  res.status(201).json({
    status: 'success',
    data: {
      matricule: newMatricule
    }
  });
});

exports.bulkCreateMatricules = catchAsync(async (req, res, next) => {
  const { matricules } = req.body;

  // Vérifier que l'utilisateur est admin ou manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé', 403));
  }

  if (!Array.isArray(matricules) || matricules.length === 0) {
    return next(new AppError('Veuillez fournir un tableau de matricules', 400));
  }

  const matriculesToInsert = matricules.map(mat => ({
    ...mat,
    matricule: mat.matricule.toUpperCase(),
    createdBy: req.user._id
  }));

  const result = await EmployeeMatricule.insertMany(matriculesToInsert, {
    ordered: false,
    rawResult: true
  });

  res.status(201).json({
    status: 'success',
    data: {
      inserted: result.insertedCount || matriculesToInsert.length,
      total: matricules.length
    }
  });
});

exports.importExcel = catchAsync(async (req, res, next) => {
  const { matricules } = req.body;

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé', 403));
  }

  if (!Array.isArray(matricules) || matricules.length === 0) {
    return next(new AppError('Aucune donnée à importer', 400));
  }

  const matriculesToInsert = matricules.map(mat => ({
    matricule: mat.matricule.toUpperCase(),
    nom: mat.nom,
    prenom: mat.prenom,
    poste: mat.poste,
    department: mat.department,
    createdBy: req.user._id
  }));

  try {
    const result = await EmployeeMatricule.insertMany(matriculesToInsert, {
      ordered: false
    });

    res.status(201).json({
      status: 'success',
      data: {
        imported: result.length,
        total: matricules.length
      }
    });
  } catch (error) {
    const inserted = error.insertedDocs ? error.insertedDocs.length : 0;

    res.status(200).json({
      status: 'partial',
      message: 'Certains matricules existent déjà',
      data: {
        imported: inserted,
        total: matricules.length,
        errors: error.writeErrors ? error.writeErrors.length : 0
      }
    });
  }
});

exports.getAllMatricules = catchAsync(async (req, res, next) => {
  const { status, department, search } = req.query;

  const query = {};

  if (status === 'available') {
    query.isUsed = false;
  } else if (status === 'used') {
    query.isUsed = true;
  }

  if (department) {
    query.department = department;
  }

  if (search) {
    query.$or = [
      { matricule: { $regex: search, $options: 'i' } },
      { nom: { $regex: search, $options: 'i' } },
      { prenom: { $regex: search, $options: 'i' } }
    ];
  }

  const matricules = await EmployeeMatricule.find(query)
    .populate('userId', 'firstname lastname email')
    .populate('createdBy', 'firstname lastname')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: matricules.length,
    data: {
      matricules
    }
  });
});

exports.getAvailableMatricules = catchAsync(async (req, res, next) => {
  const { department } = req.query;

  const query = { isUsed: false };

  if (department) {
    query.department = department;
  }

  const matricules = await EmployeeMatricule.find(query)
    .select('matricule nom prenom poste department')
    .sort({ matricule: 1 });

  res.status(200).json({
    status: 'success',
    results: matricules.length,
    data: {
      matricules
    }
  });
});

exports.checkMatricule = catchAsync(async (req, res, next) => {
  const { matricule } = req.params;

  const result = await EmployeeMatricule.checkAvailability(matricule);

  if (!result.exists) {
    return res.status(404).json({
      status: 'fail',
      message: 'Matricule introuvable',
      data: {
        exists: false,
        available: false
      }
    });
  }

  if (!result.available) {
    return res.status(400).json({
      status: 'fail',
      message: 'Ce matricule est déjà utilisé',
      data: {
        exists: true,
        available: false
      }
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Matricule valide et disponible',
    data: {
      exists: true,
      available: true,
      ...result.data
    }
  });
});

// Mettre à jour un matricule
exports.updateMatricule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { nom, prenom, poste, department } = req.body;

  // Vérifier que l'utilisateur est admin ou manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé', 403));
  }

  const matricule = await EmployeeMatricule.findById(id);

  if (!matricule) {
    return next(new AppError('Matricule introuvable', 404));
  }

  // Ne pas permettre la modification d'un matricule déjà utilisé
  if (matricule.isUsed) {
    return next(new AppError('Impossible de modifier un matricule déjà utilisé', 400));
  }

  // Mettre à jour
  if (nom) matricule.nom = nom;
  if (prenom) matricule.prenom = prenom;
  if (poste) matricule.poste = poste;
  if (department) matricule.department = department;

  await matricule.save();

  res.status(200).json({
    status: 'success',
    data: {
      matricule
    }
  });
});

// Supprimer un matricule
exports.deleteMatricule = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Vérifier que l'utilisateur est admin ou manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé', 403));
  }

  const matricule = await EmployeeMatricule.findById(id);

  if (!matricule) {
    return next(new AppError('Matricule introuvable', 404));
  }

  // Ne pas permettre la suppression d'un matricule utilisé
  if (matricule.isUsed) {
    return next(new AppError('Impossible de supprimer un matricule déjà utilisé', 400));
  }

  await EmployeeMatricule.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Obtenir les statistiques des matricules
exports.getStats = catchAsync(async (req, res, next) => {
  // Vérifier que l'utilisateur est admin ou manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return next(new AppError('Accès non autorisé', 403));
  }

  const stats = await EmployeeMatricule.getStats();

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});
