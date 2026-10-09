Services Knowledge

emailService.js

- sendMail: Generic wrapper (disabled if DISABLE_EMAIL=true)
- sendVerificationEmail(user, token)
- sendResetPasswordEmail(user, token)

Swap transport with production SMTP or API provider.
