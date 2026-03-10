
const fs = require('fs');
const path = require('path');

try {
    const pkg = require('./node_modules/@zama-fhe/relayer-sdk/package.json');
    console.log('Relayer SDK version in node_modules:', pkg.version);
} catch (e) {
    console.log('Could not find @zama-fhe/relayer-sdk in node_modules');
}

try {
    const ethers = require('ethers');
    console.log('Ethers version:', ethers.version);
    console.log('Ethers exports:', Object.keys(ethers).filter(k => k === 'ethers'));
} catch (e) {
    console.log('Ethers require failed:', e.message);
}

try {
    const hardhat = require('hardhat');
    console.log('Hardhat loaded successfully');
    console.log('Hardhat ethers available:', !!hardhat.ethers);
} catch (e) {
    console.log('Hardhat require failed:', e.message);
}
