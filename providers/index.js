const twilioProvider = require('./twilio');

class ProviderFactory {
    getProvider(providerName) {
        return twilioProvider;
    }
}

module.exports = new ProviderFactory();
