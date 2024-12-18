require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (email, nombre, verificationLink) => {
    const sender = {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
    };

    const receivers = [
        {
            email: email,
            name: nombre,
        },
    ];

    const sendSmtpEmail = {
        sender: sender,
        to: receivers,
        subject: 'Confirma tu registro',
        htmlContent: `
            <h1>¡Hola, ${nombre}!</h1>
            <p>Gracias por registrarte. Por favor, confirma tu correo haciendo clic en el siguiente enlace:</p>
            <a href="${verificationLink}">Confirmar Registro</a>
            <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
        `,
    };

    try {
        const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
        console.log('Correo de verificación enviado:', response);
    } catch (error) {
        console.error('Error al enviar el correo de verificación:', error);
        throw new Error('No se pudo enviar el correo de verificación.');
    }
};

module.exports = sendVerificationEmail;