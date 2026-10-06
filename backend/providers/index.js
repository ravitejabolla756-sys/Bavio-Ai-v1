const twilioProvider = require('./twilio');
const exotelProvider = require('./exotel');

class ProviderFactory {
    getProvider(providerName = 'twilio') {
        const normalized = (providerName || '').toLowerCase();
        if (normalized === 'exotel') {
            return exotelProvider;
        }
        return twilioProvider;
    }
}

module.exports = new ProviderFactory();
