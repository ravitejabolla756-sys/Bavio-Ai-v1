# Webhook Developer Guide

1. Register a tenant-owned endpoint through the supported Webhooks API.
2. Store the generated signing secret securely; Bavio stores protected secret material in the current hardened path.
3. Verify the `X-Bavio-Signature` header using the agreed payload and timestamp/signature contract for the deployed version.
4. Return a timely 2xx response only after safely accepting the payload.
5. Treat non-2xx, DNS, timeout, redirect, and blocked-destination results as delivery failures.

Payload schemas and event names are action/version-specific. Use synthetic examples in tests and do not assume that a delivery record means downstream business success.
