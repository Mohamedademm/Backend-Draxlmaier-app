const nodemailer = require('nodemailer');

/**
 * Email Configuration Service
 * Handles email sending for password recovery and notifications
 */

// Create transporter (Gmail configuration with explicit SMTP)
// Create transporter (Gmail configuration with explicit SMTP)
// Create transporter (Gmail configuration with explicit SMTP and Pooling)
// Create transporter
// Utilisation du service 'gmail' prédéfini qui gère automatiquement les ports/sécurité
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Force IPv4 pour éviter les problèmes de timeout sur Render (Cloud)
  family: 4,
  logger: true,
  debug: true
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email service connection error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Professional HTML template for password reset email
 */
const getResetPasswordTemplate = (resetUrl, userEmail) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background-color: #f4f7fa; 
          padding: 20px; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%); 
          padding: 40px 30px; 
          text-align: center; 
          color: white; 
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 600; 
          margin-bottom: 10px; 
        }
        .header p { 
          font-size: 14px; 
          opacity: 0.9; 
        }
        .content { 
          padding: 40px 30px; 
          color: #333; 
          line-height: 1.6; 
        }
        .content p { 
          margin-bottom: 15px; 
          font-size: 15px; 
        }
        .button-container { 
          text-align: center; 
          margin: 30px 0; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #0EA5E9, #0891B2); 
          color: white; 
          padding: 16px 40px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); 
          transition: transform 0.2s; 
        }
        .button:hover { 
          transform: translateY(-2px); 
        }
        .warning { 
          background: #FFF3CD; 
          border-left: 4px solid #FFC107; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px; 
        }
        .warning strong { 
          color: #856404; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 25px 30px; 
          text-align: center; 
          font-size: 13px; 
          color: #6c757d; 
          border-top: 1px solid #e9ecef; 
        }
        .footer p { 
          margin: 5px 0; 
        }
        .logo { 
          font-size: 48px; 
          margin-bottom: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐</div>
          <h1>Réinitialisation de Mot de Passe</h1>
          <p>Draexlmaier Employee Communication</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour le compte <strong>${userEmail}</strong>.</p>
          
          <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">Réinitialiser Mon Mot de Passe</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong> Ce lien expire dans <strong>10 minutes</strong> pour des raisons de sécurité.
          </div>
          
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel reste inchangé.</p>
          
          <p>Pour des raisons de sécurité, ne partagez jamais ce lien avec qui que ce soit.</p>
        </div>
        
        <div class="footer">
          <p><strong>© 2026 Draexlmaier Employee Communication</strong></p>
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>Si vous avez des questions, contactez votre administrateur système.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (userEmail, resetUrl) => {
  const mailOptions = {
    from: `"Draexlmaier App" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🔐 Réinitialisation de votre mot de passe - Draexlmaier',
    html: getResetPasswordTemplate(resetUrl, userEmail)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${userEmail}`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${userEmail}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  transporter,
  getResetPasswordTemplate,
  sendPasswordResetEmail
};
