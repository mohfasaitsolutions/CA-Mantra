const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html }) {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('EMAIL DISABLED, would send to', to, subject);
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'CA Mantraa <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Simple branded HTML template (email-client friendly)
function buildEmail({ title, greetingName, intro, ctaLabel, ctaUrl, footer }) {
  const brand = process.env.BRAND_NAME || 'CA Mantraa';
  const primary = process.env.BRAND_COLOR || '#2563eb';
  const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const safeTitle = title || brand;
  const nameLine = greetingName ? `Hello ${greetingName},` : `Hello,`;
  const footerHtml = footer || `You received this email because you have an account on <strong>${brand}</strong>.\nIf this wasn’t you, you can ignore this email.`;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;color:#111827;font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:${primary};padding:20px 24px;color:#fff;">
                <div style="font-size:18px;font-weight:600;">${brand}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;">
                <h1 style="margin:0 0 8px 0;font-size:20px;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 12px 0;color:#374151;">${nameLine}</p>
                <div style="color:#374151;line-height:1.6;">${intro}</div>
              </td>
            </tr>
            ${ctaLabel && ctaUrl ? `
            <tr>
              <td style="padding:8px 24px 24px 24px;">
                <a href="${ctaUrl}" style="display:inline-block;background:${primary};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${ctaLabel}</a>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <p style="margin:0;color:#6b7280;font-size:12px;">If the button doesn’t work, copy and paste this URL into your browser:</p>
                ${ctaUrl ? `<p style="margin:4px 0 0 0;color:#2563eb;word-break:break-all;font-size:12px;"><a style="color:#2563eb;" href="${ctaUrl}">${ctaUrl}</a></p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb;padding:16px 24px;color:#6b7280;font-size:12px;background:#fafafa;">
                <div>${footerHtml}</div>
                <div style="margin-top:8px;"><a href="${siteUrl}" style="color:#6b7280;text-decoration:none;">${brand}</a></div>
              </td>
            </tr>
          </table>
          <div style="color:#9ca3af;font-size:11px;margin-top:12px;">&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

async function sendVerificationEmail(user, token) {
  const base = process.env.VERIFY_EMAIL_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000/api/auth';
  const verifyUrl = `${base.replace(/\/$/, '')}/verify-email?token=${token}`;
  const html = buildEmail({
    title: 'Verify your email',
    greetingName: user.fullName,
    intro: '<p>Thanks for signing up! Please confirm your email address to activate your account.</p>',
    ctaLabel: 'Verify Email',
    ctaUrl: verifyUrl
  });
  await sendMail({ to: user.email, subject: 'Verify your email', html });
}

async function sendResetPasswordEmail(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const html = buildEmail({
    title: 'Reset your password',
    greetingName: user.fullName,
    intro: '<p>You requested to reset your password. Click the button below to proceed.</p><p>If you did not request this, you can safely ignore this email.</p>',
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl
  });
  await sendMail({ to: user.email, subject: 'Reset your password', html });
}

async function sendSetPasswordEmail(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const html = buildEmail({
    title: 'Set up your account password',
    greetingName: user.fullName,
    intro: '<p>Your account has been created by the admin. Please set your password to get started.</p>',
    ctaLabel: 'Set Password',
    ctaUrl: resetUrl
  });
  await sendMail({ to: user.email, subject: 'Set up your account password', html });
}

async function sendWelcomeEmail(user) {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  const html = buildEmail({
    title: 'Welcome to CA Mantraa',
    greetingName: user.fullName,
    intro: '<p>We’re excited to have you on board! Explore test series, track your progress, and reach your goals.</p>',
    ctaLabel: 'Go to Login',
    ctaUrl: loginUrl
  });
  await sendMail({ to: user.email, subject: 'Welcome to CA Mantraa', html });
}

async function sendRoleUpdatedEmail(user, newRole) {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  const html = buildEmail({
    title: 'Your account role has been updated',
    greetingName: user.fullName,
    intro: `<p>Your account has been updated to <strong>${newRole}</strong>. You can now access the respective dashboard and features.</p>`,
    ctaLabel: 'Go to Login',
    ctaUrl: loginUrl
  });
  await sendMail({ to: user.email, subject: 'Account role updated', html });
}

async function sendPaymentSuccessEmailToCustomer(user, testSeries, payment) {
  const coursesUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses`;
  const html = buildEmail({
    title: 'Payment Successful - Test Series Purchased',
    greetingName: user.fullName,
    intro: `
      <p>Thank you for your purchase! Your payment has been successfully processed.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;">Order Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Test Series:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${testSeries.title}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount Paid:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">₹${payment.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Payment ID:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${payment.razorpayPaymentId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Date:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${new Date().toLocaleDateString('en-IN')}</td>
          </tr>
        </table>
      </div>
      <p>You can now access this test series from your courses dashboard.</p>
    `,
    ctaLabel: 'Go to My Courses',
    ctaUrl: coursesUrl
  });
  await sendMail({ to: user.email, subject: 'Payment Successful - Test Series Purchased', html });
}

async function sendPaymentNotificationToAdmin(user, testSeries, payment) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'info.camantraa@gmail.com';
  const html = buildEmail({
    title: 'New Payment Received',
    greetingName: 'Admin',
    intro: `
      <p>A new payment has been received for a test series purchase.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;">Payment Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Customer Name:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${user.fullName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Customer Email:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Customer Phone:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${user.mobile || user.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Test Series:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${testSeries.title}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">CA Level:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${testSeries.caLevel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">₹${payment.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Payment ID:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${payment.razorpayPaymentId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Order ID:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${payment.razorpayOrderId}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;">Date:</td>
            <td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px;">${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}</td>
          </tr>
        </table>
      </div>
    `,
    footer: 'This is an automated notification from your payment system.'
  });
  await sendMail({ to: adminEmail, subject: 'New Payment Received - Test Series Purchase', html });
}

module.exports = { 
  sendMail, 
  sendVerificationEmail, 
  sendResetPasswordEmail, 
  sendSetPasswordEmail, 
  sendWelcomeEmail, 
  sendRoleUpdatedEmail,
  sendPaymentSuccessEmailToCustomer,
  sendPaymentNotificationToAdmin
};
