const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedFrom = process.env.MAIL_FROM || 'LearnSphere <no-reply@learnsphere.ai>';
let cachedIsTestAccount = false;

const toBoolean = (value) => String(value).toLowerCase() === 'true';

const createTransportFromEnv = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = toBoolean(process.env.SMTP_SECURE || 'false');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log('🔧 SMTP Config Check:', {
        host: host ? '✅ configured' : '❌ missing',
        port,
        secure,
        user: user ? user.substring(0, 10) + '...' : '❌ missing',
        pass: pass ? '✅ configured' : '❌ missing'
    });

    if (!host || !user || !pass) {
        console.log('⚠️  SMTP env vars incomplete - falling back to Ethereal');
        return null;
    }

    try {
        const transport = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            logger: true,
            debug: true
        });
        console.log('✅ Real SMTP Transport Created:', { host, port });
        return transport;
    } catch (err) {
        console.error('❌ Error creating SMTP transport:', err.message);
        return null;
    }
};

const getTransporter = async () => {
    if (cachedTransporter) {
        console.log('📧 Using cached transporter (mode:', cachedIsTestAccount ? 'Ethereal' : 'SMTP', ')');
        return {
            transporter: cachedTransporter,
            from: cachedFrom,
            isTestAccount: cachedIsTestAccount
        };
    }

    const envTransport = createTransportFromEnv();
    if (envTransport) {
        cachedTransporter = envTransport;
        cachedIsTestAccount = false;
        console.log('🚀 Real SMTP configured successfully');
        return { transporter: cachedTransporter, from: cachedFrom, isTestAccount: false };
    }

    // Fallback: ephemeral Ethereal account keeps OTP flow functional in development.
    console.log('⏳ Creating Ethereal test account (dev mode)...');
    try {
        const testAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            },
            logger: true,
            debug: true
        });
        cachedFrom = 'LearnSphere Demo <' + testAccount.user + '>';
        cachedIsTestAccount = true;
        console.log('✅ Ethereal fallback account created for dev testing');
        return { transporter: cachedTransporter, from: cachedFrom, isTestAccount: true };
    } catch (err) {
        console.error('❌ Error creating fallback Ethereal account:', err.message);
        throw new Error('Email service initialization failed: ' + err.message);
    }
};

const sendOtpEmail = async ({ to, userName, otpCode, planName, paymentHint }) => {
    console.log('\n📧 SENDING OTP EMAIL:');
    console.log('  To:', to);
    console.log('  User:', userName);
    console.log('  Plan:', planName);
    console.log('  Hint:', paymentHint);
    console.log('  OTP:', otpCode);

    try {
        const { transporter, from, isTestAccount } = await getTransporter();

        const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7ebf2;">
        <div style="background:linear-gradient(120deg,#0f172a,#1e293b);padding:18px 24px;color:#fff;">
          <h2 style="margin:0;font-size:20px;">LearnSphere Payment Verification</h2>
          <p style="margin:8px 0 0;opacity:0.85;font-size:13px;">Secure OTP verification for your premium upgrade</p>
        </div>
        <div style="padding:24px;color:#1f2937;">
          <p style="margin-top:0;">Hi ${userName || 'Learner'},</p>
          <p>Use the OTP below to confirm your payment for <strong>${planName}</strong> (${paymentHint}).</p>
          <div style="text-align:center;margin:20px 0;">
            <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:28px;letter-spacing:6px;font-weight:700;">${otpCode}</div>
          </div>
          <p style="margin:0;">This OTP is valid for <strong>5 minutes</strong>.</p>
          <p style="margin:14px 0 0;color:#6b7280;font-size:12px;">If you did not initiate this request, please ignore this email.</p>
        </div>
      </div>
    </div>`;

        const mailOptions = {
            from,
            to,
            subject: 'LearnSphere OTP for Payment Verification',
            html
        };

        console.log('  Sending via:', isTestAccount ? 'Ethereal (dev)' : 'Gmail SMTP (prod)');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ OTP EMAIL SENT SUCCESSFULLY');
        console.log('  Message ID:', info.messageId);
        console.log('  Mode:', isTestAccount ? '🧪 TEST' : '📨 REAL');

        return {
            messageId: info.messageId,
            previewUrl: isTestAccount ? (nodemailer.getTestMessageUrl(info) || null) : null,
            isTestAccount,
            success: true
        };
    } catch (err) {
        console.error('❌ OTP EMAIL SEND FAILED:');
        console.error('  Error:', err.message);
        console.error('  Stack:', err.stack);
        throw new Error('Failed to send OTP email: ' + err.message);
    }
};

const sendPaymentSuccessEmail = async ({ to, userName, planName, previousCredits, currentCredits }) => {
    console.log('\n📧 SENDING SUCCESS EMAIL:');
    console.log('  To:', to);
    console.log('  Plan:', planName);
    console.log('  Credits:', previousCredits, '->', currentCredits);

    try {
        const { transporter, from, isTestAccount } = await getTransporter();

        const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7ebf2;">
        <div style="background:linear-gradient(120deg,#065f46,#0f766e);padding:18px 24px;color:#fff;">
          <h2 style="margin:0;font-size:20px;">Payment Successful</h2>
          <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Your LearnSphere upgrade is now active</p>
        </div>
        <div style="padding:24px;color:#1f2937;">
          <p style="margin-top:0;">Hi ${userName || 'Learner'},</p>
          <p>Your payment for <strong>${planName}</strong> has been confirmed.</p>
          <p style="margin:16px 0;padding:12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;">
            Credits updated: <strong>${previousCredits}</strong> -> <strong>${currentCredits}</strong>
          </p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Thank you for upgrading LearnSphere.</p>
        </div>
      </div>
    </div>`;

        const mailOptions = {
            from,
            to,
            subject: 'LearnSphere Payment Confirmation',
            html
        };

        console.log('  Sending via:', isTestAccount ? 'Ethereal (dev)' : 'Gmail SMTP (prod)');
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ SUCCESS EMAIL SENT SUCCESSFULLY');
        console.log('  Message ID:', info.messageId);
        console.log('  Mode:', isTestAccount ? '🧪 TEST' : '📨 REAL');

        return {
            messageId: info.messageId,
            previewUrl: isTestAccount ? (nodemailer.getTestMessageUrl(info) || null) : null,
            isTestAccount,
            success: true
        };
    } catch (err) {
        console.error('❌ SUCCESS EMAIL SEND FAILED:');
        console.error('  Error:', err.message);
        console.error('  Stack:', err.stack);
        throw new Error('Failed to send success email: ' + err.message);
    }
};

module.exports = {
    sendOtpEmail,
    sendPaymentSuccessEmail
};
