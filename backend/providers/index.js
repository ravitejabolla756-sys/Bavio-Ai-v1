const twilioProvider = require('./twilio');
const exotelProvider = require('./exotel');

class ProviderFactory {
    getProvider(providerName) {
        const name = providerName.toLowerCase();
        if (name === 'exotel' || name === 'in' || name === 'india') {
            return exotelProvider;
        }
        return twilioProvider;
    }
}

module.exports = new ProviderFactory();
