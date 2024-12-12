const nodemailer = require('nodemailer');

async function sendVerificationEmail(to, link) {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: false, // false porque Mailtrap no requiere TLS estricto, pero depende del servicio
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: '"Mi App" <no-reply@miapp.com>',
        to: to,
        subject: 'Verifica tu cuenta',
        html: `<p>Gracias por registrarte. Por favor, haz clic en el siguiente enlace para verificar tu cuenta:</p>
               <p><a href="${link}">${link}</a></p>`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;