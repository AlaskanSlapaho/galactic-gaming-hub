
import crypto from 'crypto-js';

export const generateServerSeed = () => {
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2, 15);
    return crypto.SHA256(`${timestamp}-${randomString}`).toString();
};

export const generateRandomNumber = (params, min, max) => {
    const { clientSeed, serverSeed, nonce, cursor = 0 } = params;
    // Create a HMAC using the client and server seeds
    const hmac = crypto.HmacSHA256(`${clientSeed}:${nonce}:${cursor}`, serverSeed).toString();
    // Take the first 8 characters of the HMAC and convert to a decimal number
    const decimal = parseInt(hmac.slice(0, 8), 16);
    // Scale the result to our desired range
    const scaled = decimal / 0xffffffff * (max - min) + min;
    return Math.floor(scaled);
};

export const generateRandomFloat = (params, min, max, decimals = 2) => {
    const randomValue = generateRandomNumber(params, min * Math.pow(10, decimals), max * Math.pow(10, decimals));
    return randomValue / Math.pow(10, decimals);
};

export const verifyResult = (params, min, max, result) => {
    const calculated = generateRandomNumber(params, min, max);
    return calculated === result;
};

export const generateMultipleResults = (params, min, max, count) => {
    const results = [];
    for(let i = 0; i < count; i++) {
        const cursorParams = {
            ...params,
            cursor: i
        };
        results.push(generateRandomNumber(cursorParams, min, max));
    }
    return results;
};

export const createDefaultGameState = () => {
    return {
        clientSeed: Math.random().toString(36).substring(2, 15),
        serverSeed: generateServerSeed(),
        nonce: Math.floor(Math.random() * 1000000)
    };
};

export const getProvablyFairParams = (state) => {
    return {
        clientSeed: state.clientSeed,
        serverSeed: state.serverSeed,
        nonce: state.nonce
    };
};
