// utils/email.js
// One wrapper around Resend so no call site repeats the try/catch.
// Email failures never throw: a booking must not fail because a mailbox bounced.

const { Resend } = require('resend');
const { FROM_EMAIL } = require('../config/constants');

const sendEmail = async ({ to, subject, html, context = '' }) => {
  if (!to) {
    console.warn('sendEmail: no recipient', context);
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    console.log('Email sent:', context, to);
    return true;
  } catch (error) {
    console.error('Email failed:', context, to, error);
    return false;
  }
};

module.exports = { sendEmail };
