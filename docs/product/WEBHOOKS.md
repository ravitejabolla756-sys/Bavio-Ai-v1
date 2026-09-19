# Webhooks

Customers configure tenant-owned webhook endpoints. The current delivery path validates destinations, rejects unsafe redirects, applies a timeout, signs payloads, protects stored signing secrets, and records delivery/action evidence.

Delivery can fail because of DNS, destination policy, timeout, HTTP response, or connection error. A recorded ActionExecution or evidence row proves Bavio’s technical observation; it does not prove downstream processing. The verified workflow runtime does not blindly resend an uncertain mutating delivery.

Use HTTPS endpoints where supported, verify the Bavio signature, protect the endpoint, and avoid placing secrets in payloads. Event/action payload schemas should be confirmed against the specific integration version before production use.
