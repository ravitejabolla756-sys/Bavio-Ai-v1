'use strict';

const {
  ModelRouter,
  defaultModelRouter,
  isIndicLanguage,
  CUSTOMER_TIER_PRICING,
  TIER_INFRA_TARGETS,
  PROVIDER_RATES,
  USD_TO_INR_RATE,
} = require('./modelRouter');
const { PROVIDER_REGISTRY, getProviderRegistry } = require('./providerRegistry');
const pricingConfig = require('./pricingConfig');

module.exports = {
  ModelRouter,
  modelRouter: defaultModelRouter,
  isIndicLanguage,
  CUSTOMER_TIER_PRICING,
  TIER_INFRA_TARGETS,
  PROVIDER_RATES,
  USD_TO_INR_RATE,
  PROVIDER_REGISTRY,
  getProviderRegistry,
  pricingConfig,
};
