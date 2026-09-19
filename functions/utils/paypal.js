// utils/paypal.js

const { PAYPAL_BASE_URL, USD_EXCHANGE_RATE } = require('../config/constants');

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayPal token failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
};

/** PayPal no opera en lempiras: todo se cobra en USD. */
const toUSD = (amount, currency) =>
  currency === 'HNL'
    ? (amount / USD_EXCHANGE_RATE).toFixed(2)
    : Number(amount).toFixed(2);

const createOrder = async ({ pricing, currency, activityName }) => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: activityName,
          amount: {
            currency_code: 'USD',
            value: toUSD(pricing.total, currency),
          },
        },
      ],
      application_context: {
        brand_name: 'Yojoa Travel',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: 'https://yojoatravel.com/payment/success',
        cancel_url: 'https://yojoatravel.com/payment/cancel',
      },
    }),
  });

  const order = await res.json();

  if (!order.id) {
    console.error('PayPal order response:', JSON.stringify(order));
    throw new Error('PayPal no devolvió un id de orden');
  }

  return {
    orderId: order.id,
    approvalUrl: order.links?.find((l) => l.rel === 'approve')?.href || null,
  };
};

const captureOrder = async (orderId) => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.json();
};

module.exports = { getAccessToken, createOrder, captureOrder, toUSD };