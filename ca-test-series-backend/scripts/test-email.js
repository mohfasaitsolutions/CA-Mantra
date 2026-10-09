require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendMail } = require('../src/services/emailService');

async function testEmail() {
  try {
    console.log('🚀 Testing Resend email service...');
    console.log('Sending test email to: info.camantraa@gmail.com');
    console.log('Note: With test API key, emails can only be sent to the registered account email');
    
    const result = await sendMail({
      to: 'info.camantraa@gmail.com',
      subject: 'Test Email - Resend Integration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Email Test Successful!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0;">Resend Integration Working</h2>
            
            <p>Hello!</p>
            
            <p>This is a test email sent from your <strong>CA Test Series Backend</strong> using <strong>Resend</strong> email service.</p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Test Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Service:</strong> Resend API</li>
                <li><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</li>
                <li><strong>Status:</strong> ✅ Successfully Delivered</li>
              </ul>
            </div>
            
            <p>If you're seeing this email, it means:</p>
            <ul>
              <li>✅ Resend API key is configured correctly</li>
              <li>✅ Email service is working properly</li>
              <li>✅ Ready to send transactional emails</li>
            </ul>
            
            <div style="background: #667eea; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-top: 30px;">
              <p style="margin: 0;">🚀 Your email system is ready to go!</p>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px; text-align: center;">
              This is an automated test email from CA Test Series LMS
            </p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ Email sent successfully!');
    if (result?.id) {
      console.log('📧 Email ID:', result.id);
    }
    console.log('\n✨ Check your inbox at info.camantraa@gmail.com');
    console.log('\n📝 Note: To send emails to other addresses (like manavkhadka.codes@gmail.com):');
    console.log('   1. Verify your domain at https://resend.com/domains');
    console.log('   2. Update MAIL_FROM to use your verified domain (e.g., noreply@camantraa.com)');
    console.log('   3. Or upgrade your Resend plan for production use');
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure RESEND_API_KEY is set in your .env file');
    console.error('2. Verify your API key is valid at https://resend.com/api-keys');
    console.error('3. Check that MAIL_FROM uses a verified domain or onboarding@resend.dev');
    process.exit(1);
  }
}

testEmail();
