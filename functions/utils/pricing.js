const { PRICING_CONFIG } = require('../config/constants');

const calculatePricing = (basePrice) => {
    if (!PRICING_CONFIG.enabled) {
        return {
            basePrice,
            serviceFee: 0.0,
            tax: 0.0,
            total: basePrice
        };
    }


    const serviceFee = Math.round(basePrice * PRICING_CONFIG.serviceFee * 100) / 100;
    const tax = Math.round((basePrice + serviceFee) * PRICING_CONFIG.taxPercent * 100) / 100;
    const total = basePrice + serviceFee + tax;

    return { basePrice, serviceFee, tax, total };

};

module.exports = {calculatePricing};