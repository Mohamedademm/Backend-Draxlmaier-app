const mongoose = require('mongoose');

/**
 * EmployeeMatricule Schema
 * Gère les matricules pré-créés par les admins/managers
 */
const employeeMatriculeSchema = new mongoose.Schema({
  // Matricule unique (ex: "001", "014", "DRX001")
  matricule: {
    type: String,
    required: [true, 'Le matricule est requis'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },

  // Informations de l'employé
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },

  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },

  poste: {
    type: String,
    required: [true, 'Le poste est requis'],
    trim: true
  },

  // Département (6 départements)
  department: {
    type: String,
    required: [true, 'Le département est requis'],
    enum: [
      'Qualité',
      'Logistique',
      'MM Shift A',
      'MM Shift B',
      'SZB Shift A',
      'SZB Shift B'
    ],
    index: true
  },

  // Statut du matricule
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },

  // Référence à l'utilisateur qui a utilisé ce matricule
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Qui a créé ce matricule
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Date d'utilisation du matricule
  usedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Index composé pour recherches rapides
employeeMatriculeSchema.index({ isUsed: 1, department: 1 });
employeeMatriculeSchema.index({ matricule: 1, isUsed: 1 });

// Méthode pour marquer le matricule comme utilisé
employeeMatriculeSchema.methods.markAsUsed = function(userId) {
  this.isUsed = true;
  this.userId = userId;
  this.usedAt = new Date();
  return this.save();
};

// Méthode statique pour vérifier si un matricule existe et est disponible
employeeMatriculeSchema.statics.checkAvailability = async function(matricule) {
  const mat = await this.findOne({ matricule: matricule.toUpperCase() });
  
  if (!mat) {
    return { exists: false, available: false, data: null };
  }
  
  if (mat.isUsed) {
    return { exists: true, available: false, data: null };
  }
  
  return { 
    exists: true, 
    available: true, 
    data: {
      nom: mat.nom,
      prenom: mat.prenom,
      poste: mat.poste,
      department: mat.department
    }
  };
};

// Méthode statique pour obtenir les statistiques
employeeMatriculeSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const used = await this.countDocuments({ isUsed: true });
  const available = await this.countDocuments({ isUsed: false });
  
  const byDepartment = await this.aggregate([
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        used: { $sum: { $cond: ['$isUsed', 1, 0] } },
        available: { $sum: { $cond: ['$isUsed', 0, 1] } }
      }
    }
  ]);
  
  return {
    total,
    used,
    available,
    byDepartment
  };
};

const EmployeeMatricule = mongoose.model('EmployeeMatricule', employeeMatriculeSchema);

module.exports = EmployeeMatricule;
