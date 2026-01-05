const express = require('express');
const matriculeController = require('../controllers/matriculeController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Route publique pour vérification lors de l'inscription (SANS authentification)
router.get('/check/:matricule', matriculeController.checkMatricule);

// Toutes les autres routes nécessitent authentification
router.use(authenticate);

// Routes publiques (pour tous les utilisateurs authentifiés)
router.get('/available', matriculeController.getAvailableMatricules);

// Routes admin/manager uniquement
router.post('/create', matriculeController.createMatricule);
router.post('/bulk-create', matriculeController.bulkCreateMatricules);
router.post('/import-excel', matriculeController.importExcel);
router.get('/', matriculeController.getAllMatricules);
router.get('/stats', matriculeController.getStats);
router.put('/:id', matriculeController.updateMatricule);
router.delete('/:id', matriculeController.deleteMatricule);

module.exports = router;
