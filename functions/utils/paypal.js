const { PAYPAL_BASE_URL } = require('../config/constants');

const getPayAccessToken = async () => {

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    console.log("Paypal clientId exists: ",clientId);
    console.log("Paypal secret exists: ",secret);

    const response = await fetch(`${PAYPAL_BASE_URL}/v1,oauth/token`,{
        method: 'POST',
        headers: {
            'Content-Type':'application/x-www-form-urlencoded',
            'Authorization':`Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
};

const convertToUSD = (hn1) => (hn1 / 26.8).toFixed(2);

module.exports = {
    getPayAccessToken,
    convertToUSD
}