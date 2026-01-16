# Guide Backend - Upload de Fichiers

## 🎯 Objectif
Implémenter l'endpoint d'upload de fichiers pour le chat de groupe.

## 📦 Installation des Dépendances

```bash
cd backend
npm install multer --save
```

## 🔧 Configuration

### 1. Créer le dossier uploads
```bash
mkdir uploads
```

### 2. Ajouter au .gitignore
```
uploads/
!uploads/.gitkeep
```

## 💻 Implémentation

### Option 1: Stockage Local (Simple)

Créer `backend/routes/upload.js`:

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
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
    cb(new Error('Type de fichier non supporté'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  }
});

// Endpoint d'upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileType: req.body.fileType || 'document',
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour supprimer un fichier (optionnel)
router.delete('/upload/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Fichier supprimé' });
    } else {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 3. Intégrer dans server.js

Ajouter dans `backend/server.js`:

```javascript
const express = require('express');
const app = express();
const path = require('path');

// ... autres imports ...

// Servir les fichiers uploads statiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const uploadRoutes = require('./routes/upload');
app.use('/api', uploadRoutes);

// ... reste du code ...
```

## 🎯 Option 2: Stockage Cloud (Production)

### AWS S3

```javascript
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'chat-files/' + uniqueSuffix + ext);
    }
  }),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

### Azure Blob Storage

```javascript
const { BlobServiceClient } = require('@azure/storage-blob');
const multerAzure = require('multer-azure-storage');

const upload = multer({
  storage: multerAzure({
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: 'chat-files',
    blobName: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return uniqueSuffix + path.extname(file.originalname);
    }
  }),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

## 🔐 Sécurité

### 1. Validation Stricte

```javascript
// Vérifier le type MIME ET l'extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Extension non autorisée'), false);
  }
  
  // Vérifier aussi le type MIME
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Type MIME non autorisé'), false);
  }
  
  cb(null, true);
};
```

### 2. Scanner Antivirus (Optionnel)

```javascript
const ClamScan = require('clamscan');

const clamscan = await new ClamScan().init({
  clamdscan: {
    socket: '/var/run/clamav/clamd.ctl',
    timeout: 60000,
  }
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Scanner le fichier
    const { isInfected, viruses } = await clamscan.isInfected(req.file.path);
    
    if (isInfected) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Fichier infecté détecté' });
    }
    
    // Continue...
  } catch (error) {
    // Gérer l'erreur
  }
});
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads max par 15 minutes
  message: 'Trop d\'uploads, réessayez plus tard'
});

router.post('/upload', auth, uploadLimiter, upload.single('file'), async (req, res) => {
  // ...
});
```

## 📊 Monitoring

### 1. Logger les uploads

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'uploads.log' })
  ]
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  logger.info({
    user: req.user.id,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    timestamp: new Date()
  });
  
  // ...
});
```

### 2. Nettoyer les fichiers anciens

```javascript
const cron = require('node-cron');

// Nettoyer les fichiers > 30 jours chaque nuit à 2h
cron.schedule('0 2 * * *', () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      console.log(`Fichier supprimé: ${file}`);
    }
  });
});
```

## 🧪 Tests

### Test manuel avec curl

```bash
# Upload d'une image
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "fileType=image"

# Upload d'un PDF
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "fileType=pdf"
```

### Test avec Postman

1. Créer une requête POST vers `http://localhost:3000/api/upload`
2. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
3. Body (form-data):
   - `file`: Sélectionner un fichier
   - `fileType`: Entrer "image" ou "pdf"

## 🚀 Déploiement

### Render.com

1. Ajouter dans `render.yaml`:
```yaml
services:
  - type: web
    name: backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 10
```

2. Les fichiers seront persistés sur le disque Render

### Heroku

⚠️ **Attention**: Heroku a un système de fichiers éphémère. Utilisez AWS S3 ou Cloudinary à la place.

## 📝 Variables d'Environnement

Ajouter dans `.env`:

```bash
# Pour stockage local
BASE_URL=https://backend-draxlmaier-app.onrender.com

# Pour AWS S3 (optionnel)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=your-bucket

# Pour Azure (optionnel)
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

## ✅ Checklist Déploiement

- [ ] Dépendances installées (`multer`)
- [ ] Dossier `uploads/` créé
- [ ] Route configurée dans `server.js`
- [ ] Middleware d'authentification activé
- [ ] Validation des fichiers implémentée
- [ ] Limite de taille configurée
- [ ] Variable BASE_URL définie
- [ ] Tests effectués localement
- [ ] Déployé sur Render
- [ ] Tests effectués en production

## 🆘 Dépannage

### Erreur: "ENOENT: no such file or directory"
```bash
mkdir uploads
chmod 755 uploads
```

### Erreur: "File too large"
Augmenter la limite dans le code:
```javascript
limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
```

### Fichiers ne s'affichent pas
Vérifier que `/uploads` est bien servi:
```javascript
app.use('/uploads', express.static('uploads'));
```

---

**Date**: 16 Janvier 2026  
**Version**: 1.0  
**Statut**: ✅ Prêt pour l'implémentation
