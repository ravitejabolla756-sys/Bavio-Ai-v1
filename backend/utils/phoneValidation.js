const fs = require('fs');
const path = require('path');

// Simple regex checking for digits only, stripping formatting characters
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/[+\s()\-]/g, '');
}

/**
 * Validates and normalizes user phone numbers based on supported country configurations.
 * Enforces that dialing prefix matches country ISO code and format is valid.
 */
function validateAndNormalizePhone(phoneNumber, countryIso) {
    if (!phoneNumber) {
        return { valid: false, error: 'Phone number is required' };
    }
    if (!countryIso) {
        return { valid: false, error: 'Country selection is required' };
    }

    const iso = countryIso.toUpperCase().trim();

    // 1. Load supported countries config
    let countries = [];
    try {
        const countriesPath = path.join(__dirname, '..', 'config', 'supported-countries.json');
        countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    } catch (err) {
        console.error('[PHONE VALIDATION] Failed to load supported-countries config:', err.message);
        return { valid: false, error: 'Internal configuration error' };
    }

    // 2. Resolve country config
    const countryConfig = countries.find(c => c.iso2 === iso && c.enabled === true);
    if (!countryConfig) {
        return { valid: false, error: `Bavio does not support provisioning virtual numbers for country: ${iso}` };
    }

    // 3. String cleanup and prefix matching
    const trimmed = phoneNumber.trim();
    const cleanPrefix = countryConfig.dialCode.replace('+', '');
    const cleanNum = cleanPhoneNumber(trimmed);

    // Enforce E.164-like start (if original has '+', verify it matches dial code)
    if (trimmed.startsWith('+')) {
        if (!trimmed.startsWith(countryConfig.dialCode)) {
            return { 
                valid: false, 
                error: `Mismatched phone number: Selected country is ${countryConfig.name} (${countryConfig.dialCode}) but number starts with another prefix.` 
            };
        }
    } else {
        // If it starts with local dialing prefix (like 0 in UK/AU), strip it or verify it starts with dialCode digits
        if (cleanNum.startsWith(cleanPrefix)) {
            // Good
        } else {
            // Try to append dial prefix if it's a raw local number
            // Check length (usually national number has 8-10 digits)
            if (cleanNum.length >= 8 && cleanNum.length <= 11) {
                // If it starts with local trunk prefix '0', strip it
                const nationalNum = cleanNum.startsWith('0') ? cleanNum.substring(1) : cleanNum;
                const normalized = '+' + cleanPrefix + nationalNum;
                return {
                    valid: true,
                    normalized: normalized
                };
            }
            return {
                valid: false,
                error: `Phone number must match dial code: ${countryConfig.dialCode}`
            };
        }
    }

    // Final E.164 assembly
    const normalized = '+' + cleanNum;
    
    // Quick validation of E.164 length (min 10, max 15 digits including country code)
    if (cleanNum.length < 10 || cleanNum.length > 15) {
        return { valid: false, error: 'Phone number length is invalid for E.164 format' };
    }

    return {
        valid: true,
        normalized: normalized
    };
}

module.exports = { validateAndNormalizePhone };
