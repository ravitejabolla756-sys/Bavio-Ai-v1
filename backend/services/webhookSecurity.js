'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');

function ipv4ToNumber(address) {
  const parts = address.split('.').map(Number);
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function inIpv4Range(address, start, end) {
  const value = ipv4ToNumber(address);
  return value >= ipv4ToNumber(start) && value <= ipv4ToNumber(end);
}

function isBlockedIp(address) {
  const normalized = String(address).toLowerCase().split('%')[0];
  if (net.isIP(normalized) === 4) {
    return [
      ['0.0.0.0', '0.255.255.255'],
      ['10.0.0.0', '10.255.255.255'],
      ['100.64.0.0', '100.127.255.255'],
      ['127.0.0.0', '127.255.255.255'],
      ['169.254.0.0', '169.254.255.255'],
      ['172.16.0.0', '172.31.255.255'],
      ['192.0.0.0', '192.0.0.255'],
      ['192.0.2.0', '192.0.2.255'],
      ['192.168.0.0', '192.168.255.255'],
      ['198.18.0.0', '198.19.255.255'],
      ['198.51.100.0', '198.51.100.255'],
      ['203.0.113.0', '203.0.113.255'],
      ['224.0.0.0', '255.255.255.255'],
    ].some(([start, end]) => inIpv4Range(normalized, start, end));
  }
  if (net.isIP(normalized) !== 6) return false;
  const compact = normalized.replace(/^\[|\]$/g, '');
  if (compact === '::' || compact === '::1' || compact.startsWith('fc') || compact.startsWith('fd') || compact.startsWith('fe8') || compact.startsWith('fe9') || compact.startsWith('fea') || compact.startsWith('feb') || compact.startsWith('ff') || compact.startsWith('2001:db8')) return true;
  if (compact.startsWith('::ffff:')) return isBlockedIp(compact.slice(7));
  return false;
}

function isUrlSafe(urlString, { allowHttp = false, allowTestLoopback = false } = {}) {
  try {
    const parsed = new URL(urlString);
    const allowedProtocols = allowHttp ? ['http:', 'https:'] : ['https:'];
    if (allowTestLoopback && process.env.NODE_ENV === 'test') return ['http:', 'https:'].includes(parsed.protocol) && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase()) && !parsed.username && !parsed.password;
    if (!allowedProtocols.includes(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname) return false;
    if (parsed.hostname.toLowerCase() === 'localhost' || isBlockedIp(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function validateWebhookUrl(urlString, { lookup = dns.lookup, allowTestLoopback = false } = {}) {
  if (!isUrlSafe(urlString, { allowTestLoopback })) throw Object.assign(new Error('Webhook destination is not allowed.'), { code: 'WEBHOOK_DESTINATION_BLOCKED' });
  const parsed = new URL(urlString);
  if (allowTestLoopback && process.env.NODE_ENV === 'test' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase())) return { url: parsed, addresses: [parsed.hostname] };
  const answers = await lookup(parsed.hostname, { all: true, verbatim: true });
  const addresses = (Array.isArray(answers) ? answers : [answers]).map((answer) => typeof answer === 'string' ? answer : answer.address);
  if (!addresses.length || addresses.some(isBlockedIp)) throw Object.assign(new Error('Webhook destination is not allowed.'), { code: 'WEBHOOK_DESTINATION_BLOCKED' });
  return { url: parsed, addresses };
}

function createPinnedLookup(addresses) {
  return (hostname, options, callback) => {
    const family = options && options.family;
    const address = addresses.find((candidate) => !family || net.isIP(candidate) === family) || addresses[0];
    if (!address) return callback(Object.assign(new Error('Webhook destination resolution failed.'), { code: 'WEBHOOK_DNS_FAILED' }));
    if (options && options.all) return callback(null, addresses.map((value) => ({ address: value, family: net.isIP(value) })));
    return callback(null, address, net.isIP(address));
  };
}

module.exports = { isBlockedIp, isUrlSafe, validateWebhookUrl, createPinnedLookup };
