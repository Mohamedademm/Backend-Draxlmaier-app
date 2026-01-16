const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { authenticate } = require('../middleware/auth');

// Enable CORS for all upload routes
router.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Handle OPTIONS preflight requests
router.options('*', cors());

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads créé');
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Nettoyer le nom de fichier (enlever caractères spéciaux)
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, cleanName + '-' + uniqueSuffix + ext);
  }
});

// Validation des fichiers
const fileFilter = (req, file, cb) => {
  // Types de fichiers acceptés
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Types acceptés: images (JPEG, PNG, GIF, WebP), PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  }
});

// Endpoint d'upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucun fichier fourni' 
      });
    }

    // Construire l'URL du fichier
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('📤 Fichier uploadé:', {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      user: req.user.id
    });
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileType: req.body.fileType || 'document',
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Endpoint pour supprimer un fichier (optionnel)
router.delete('/upload/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        error: 'Fichier non trouvé' 
      });
    }
    
    // Supprimer le fichier
    fs.unlinkSync(filePath);
    
    console.log('🗑️  Fichier supprimé:', filename);
    
    res.json({ 
      success: true, 
      message: 'Fichier supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Endpoint pour obtenir la liste des fichiers d'un utilisateur (optionnel)
router.get('/uploads', authenticate, async (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    const fileList = files.map(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      return {
        filename: file,
        url: `${baseUrl}/uploads/${file}`,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });
    
    res.json({
      success: true,
      files: fileList,
      count: fileList.length
    });
  } catch (error) {
    console.error('❌ Erreur liste fichiers:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
