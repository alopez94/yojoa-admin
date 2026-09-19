// utils/pricing.js
// Un solo lugar donde se decide cuánto cuesta una reserva.

const { PRICING_CONFIG } = require('../config/constants');

const calculatePricing = (basePrice) => {
  const base = Number(basePrice) || 0;

  if (!PRICING_CONFIG.enabled) {
    return { basePrice: base, serviceFee: 0, tax: 0, total: base };
  }

  const serviceFee = Math.round(base * (PRICING_CONFIG.serviceFeePercentage / 100));
  const tax = Math.round((base + serviceFee) * (PRICING_CONFIG.taxPercent / 100));

  return {
    basePrice: base,
    serviceFee,
    tax,
    total: base + serviceFee + tax,
  };
};

module.exports = { calculatePricing };