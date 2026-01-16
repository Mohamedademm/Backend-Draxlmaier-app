# 🚀 Guide de Déploiement Backend - Upload de Fichiers

## ✅ Implémentation Terminée

### Fichiers Créés/Modifiés:

1. **`routes/uploadRoutes.js`** ✅
   - Endpoint POST `/api/upload` - Upload de fichiers
   - Endpoint DELETE `/api/upload/:filename` - Suppression
   - Endpoint GET `/api/uploads` - Liste des fichiers
   - Validation des types de fichiers
   - Limite de taille: 10 MB

2. **`models/Message.js`** ✅
   - Ajout des champs: `fileUrl`, `fileName`, `fileType`

3. **`socket/socketHandler.js`** ✅
   - Support des fichiers dans les messages en temps réel

4. **`server.js`** ✅
   - Route `/api/upload` configurée
   - Dossier `/uploads` servi statiquement

5. **`package.json`** ✅
   - Dépendance `multer` installée

6. **`uploads/` folder** ✅
   - Dossier créé avec `.gitkeep`
   - Ajouté au `.gitignore`

## 🧪 Test Local

### 1. Vérifier que le serveur fonctionne

```bash
cd backend
node server.js
```

Vous devriez voir:
```
✅ Server running in development mode on port 3000
✅ MongoDB Atlas connected successfully
```

### 2. Tester avec curl

```bash
# Remplacer YOUR_TOKEN par votre token JWT
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/your/file.jpg" \
  -F "fileType=image"
```

### 3. Tester avec le script fourni

```bash
# D'abord, se connecter pour obtenir un token
node test-login.js

# Utiliser le token pour tester l'upload
node test-upload.js YOUR_TOKEN
```

## 🌐 Déploiement sur Render

### Option 1: Via le Dashboard Render

1. **Connectez-vous à [Render.com](https://render.com)**

2. **Accédez à votre service backend** (backend-draxlmaier-app)

3. **Ajoutez un disque persistant:**
   - Allez dans l'onglet "Disks"
   - Cliquez sur "Add Disk"
   - Configurez:
     - **Name**: uploads-disk
     - **Mount Path**: /opt/render/project/src/uploads
     - **Size**: 10 GB (ou selon vos besoins)
   - Cliquez sur "Save"

4. **Vérifiez les variables d'environnement:**
   - Onglet "Environment"
   - Assurez-vous que `BASE_URL` est défini:
     ```
     BASE_URL=https://backend-draxlmaier-app.onrender.com
     ```

5. **Déployez:**
   - Render détectera automatiquement les changements dans votre dépôt Git
   - Ou cliquez sur "Manual Deploy" → "Deploy latest commit"

### Option 2: Via render.yaml

Ajoutez dans votre `render.yaml`:

```yaml
services:
  - type: web
    name: backend-draxlmaier-app
    env: node
    region: frankfurt
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: BASE_URL
        value: https://backend-draxlmaier-app.onrender.com
      - key: MONGODB_URI
        sync: false
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 10
```

Puis:
```bash
git add .
git commit -m "Add file upload feature"
git push origin main
```

## 📊 Vérification du Déploiement

### 1. Health Check

```bash
curl https://backend-draxlmaier-app.onrender.com/health
```

Devrait retourner:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-01-16T..."
}
```

### 2. Test Upload

```bash
# Avec votre token de production
curl -X POST https://backend-draxlmaier-app.onrender.com/api/upload \
  -H "Authorization: Bearer YOUR_PROD_TOKEN" \
  -F "file=@test.jpg" \
  -F "fileType=image"
```

### 3. Vérifier les Logs Render

Dans le dashboard Render, onglet "Logs", vous devriez voir:
```
✅ Dossier uploads créé
📤 Fichier uploadé: { originalName: 'test.jpg', ... }
```

## 🔐 Sécurité en Production

### 1. Limites de Taille

Par défaut: 10 MB. Pour modifier:

```javascript
// routes/uploadRoutes.js
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB
  }
});
```

### 2. Types de Fichiers

Actuellement acceptés:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT

Pour ajouter d'autres types:

```javascript
// routes/uploadRoutes.js
const allowedTypes = [
  'image/jpeg',
  // ... existants
  'video/mp4',  // Ajouter vidéos
  'audio/mpeg'  // Ajouter audio
];
```

### 3. Rate Limiting

Le rate limiter global s'applique déjà (`/api/`).

Pour un rate limiting spécifique à l'upload:

```javascript
// routes/uploadRoutes.js
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads max
  message: 'Trop d\'uploads, réessayez plus tard'
});

router.post('/upload', authenticate, uploadLimiter, upload.single('file'), ...);
```

## 📁 Stockage des Fichiers

### Sur Render (Free Tier)

⚠️ **Important**: Le plan gratuit de Render a des limitations:
- **Disque éphémère**: Les fichiers peuvent être perdus lors des redémarrages
- **Solution**: Utiliser un disque persistant (10 GB gratuit)

### Migration vers le Cloud (Recommandé pour Production)

#### Option A: AWS S3

```bash
npm install aws-sdk multer-s3
```

```javascript
// routes/uploadRoutes.js
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
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'chat-files/' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});
```

#### Option B: Cloudinary (Gratuit jusqu'à 25 GB)

```bash
npm install cloudinary multer-storage-cloudinary
```

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-uploads',
    allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx']
  }
});
```

## 🧹 Maintenance

### Nettoyer les Vieux Fichiers

Créer un job CRON pour supprimer les fichiers > 30 jours:

```javascript
// utils/cleanupFiles.js
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Tous les jours à 2h du matin
cron.schedule('0 2 * * *', () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const files = fs.readdirSync(uploadsDir);
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  let deleted = 0;
  files.forEach(file => {
    if (file === '.gitkeep') return;
    
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  });
  
  console.log(`🧹 Nettoyage: ${deleted} fichiers supprimés`);
});
```

Installer:
```bash
npm install node-cron
```

Ajouter dans `server.js`:
```javascript
require('./utils/cleanupFiles');
```

## 📈 Monitoring

### Logs à Surveiller

Dans les logs Render, surveillez:
- `📤 Fichier uploadé:` - Uploads réussis
- `❌ Erreur upload:` - Échecs d'upload
- `🧹 Nettoyage:` - Maintenance des fichiers

### Métriques Importantes

1. **Nombre d'uploads par jour**
2. **Taille totale des fichiers**
3. **Taux d'erreur d'upload**
4. **Types de fichiers les plus uploadés**

## 🐛 Dépannage

### Erreur: "Aucun fichier fourni"

**Cause**: Le fichier n'est pas envoyé ou le nom du champ n'est pas 'file'

**Solution**:
```dart
// Flutter - Vérifier le nom du champ
request.files.add(await http.MultipartFile.fromPath('file', file.path));
```

### Erreur: "Type de fichier non supporté"

**Cause**: Le type MIME du fichier n'est pas dans la liste autorisée

**Solution**: Ajouter le type dans `allowedTypes` dans uploadRoutes.js

### Erreur: "File too large"

**Cause**: Le fichier dépasse 10 MB

**Solution**: Augmenter la limite dans uploadRoutes.js ou compresser le fichier côté client

### Les fichiers disparaissent après redémarrage

**Cause**: Pas de disque persistant configuré sur Render

**Solution**: Ajouter un disque persistant via le dashboard ou render.yaml

## ✅ Checklist de Déploiement

- [x] Code backend implémenté
- [x] Multer installé
- [x] Dossier uploads créé
- [x] .gitignore configuré
- [ ] Variables d'environnement configurées sur Render
- [ ] Disque persistant ajouté sur Render
- [ ] Code pushé sur Git
- [ ] Déploiement déclenché sur Render
- [ ] Tests effectués en production
- [ ] Monitoring activé

## 🎉 Prochaines Étapes

1. **Tester l'app Flutter** avec le backend en production
2. **Monitorer les uploads** dans les premiers jours
3. **Optimiser** selon l'utilisation réelle
4. **Migrer vers S3/Cloudinary** si besoin de plus d'espace
5. **Implémenter la compression d'images** côté serveur si nécessaire

---

**Date**: 16 Janvier 2026  
**Version**: 1.0  
**Statut**: ✅ Prêt pour le Déploiement
