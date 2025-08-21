#!/usr/bin/env node

// Generate Secure API Keys for Performance Insights Dashboard
// Run with: node generate-secure-keys.js

import crypto from 'crypto';

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Key(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[/+=]/g, '').substring(0, length);
}

console.log('\n🔐 Performance Insights - Secure API Key Generator\n');
console.log('📋 Copy these values to your .env files:\n');

console.log('🔑 API_SECRET_KEY (for backend ai-api-server/.env):');
console.log(`API_SECRET_KEY=${generateSecureKey(32)}\n`);

console.log('🔑 VITE_API_SECRET_KEY (for frontend .env.local):');
const frontendKey = generateSecureKey(32);
console.log(`VITE_API_SECRET_KEY=${frontendKey}\n`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('• Both keys should be identical for authentication to work');
console.log('• Never commit these keys to version control');
console.log('• Regenerate keys for production deployment');
console.log('• Store keys securely and rotate them regularly\n');

console.log('📝 Recommended usage:');
console.log('1. Copy the same key value to both files');
console.log('2. Replace placeholder values in configuration files');
console.log('3. Restart both frontend and backend servers\n');

console.log('🔒 Security Level: Cryptographically secure random keys');
console.log('🎯 Key Length: 32 bytes (256 bits) - Industry standard\n');
