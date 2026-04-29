let transporterPromise = null;

const getTransporter = async () => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporterPromise) {
    transporterPromise = import('nodemailer').then((m) =>
      m.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined
      })
    );
  }
  return transporterPromise;
};

export const sendVerificationEmail = async (to, code) => {
  const transporter = await getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[mail:dev] verification code for ${to}: ${code}`);
    }
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@bildyapp.local',
    to,
    subject: 'Tu código de verificación BildyApp',
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`
  });
};
