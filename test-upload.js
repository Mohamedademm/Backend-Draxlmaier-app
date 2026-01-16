const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Test script pour l'upload de fichiers
 * Usage: node test-upload.js [token]
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.argv[2]; // Token passé en argument

if (!TOKEN) {
  console.log('❌ Veuillez fournir un token d\'authentification');
  console.log('Usage: node test-upload.js <token>');
  console.log('\nPour obtenir un token, connectez-vous via /api/auth/login');
  process.exit(1);
}

async function testUpload() {
  try {
    console.log('🧪 Test de l\'endpoint d\'upload...\n');

    // Créer un fichier de test
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'Ceci est un fichier de test pour l\'upload');

    // Créer le FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('fileType', 'document');

    // Envoyer la requête
    console.log('📤 Envoi du fichier...');
    const response = await axios.post(
      `${BASE_URL}/api/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    console.log('✅ Upload réussi!');
    console.log('\nRéponse:');
    console.log(JSON.stringify(response.data, null, 2));

    // Nettoyer le fichier de test
    fs.unlinkSync(testFilePath);
    console.log('\n🗑️  Fichier de test supprimé');

    // Tester l'accès au fichier
    console.log('\n🔍 Test d\'accès au fichier...');
    const fileUrl = response.data.fileUrl;
    const fileResponse = await axios.get(fileUrl);
    console.log('✅ Fichier accessible!');
    console.log(`📄 Contenu: ${fileResponse.data}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Tester aussi la liste des fichiers
async function testListFiles() {
  try {
    console.log('\n🔍 Test de la liste des fichiers...');
    const response = await axios.get(
      `${BASE_URL}/api/uploads`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    console.log('✅ Liste récupérée!');
    console.log(`📁 Nombre de fichiers: ${response.data.count}`);
    if (response.data.files.length > 0) {
      console.log('\nPremiers fichiers:');
      response.data.files.slice(0, 3).forEach(file => {
        console.log(`  - ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la liste:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Exécuter les tests
(async () => {
  await testUpload();
  await testListFiles();
  console.log('\n✅ Tous les tests terminés!');
  process.exit(0);
})();
