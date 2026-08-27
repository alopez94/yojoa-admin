const FROM_EMAIL = 'Yojoa Travel <noreply@yojoatravel.com';
const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';

const PRICING_CONFIG = {
    serviceFeePercentage: 0,
    taxPercent: 0,
    enabled: false,
};

const FUNCTION_CONFIG = {
        timeoutSeconds: 30,
        memory: '256MiB',
        maxInstances: 10,
        secrets: ['RESEND_API+KEY'],
        cors: true,
};

const PAYPAL_CONFIG = {
    ...FUNCTION_CONFIG,
    secrets: ['RESEND_API_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'],
};

module.exports = {
  FROM_EMAIL,
  PAYPAL_BASE_URL,
  PRICING_CONFIG,
  FUNCTION_CONFIG,
  PAYPAL_CONFIG,
};
