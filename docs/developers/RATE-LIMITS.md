# Rate Limits

Formal public API rate limits are not yet published.

Clients should use bounded request sizes, pagination, keyset cursors where offered, exponential backoff for safe reads, and idempotency keys for supported mutations. Provider-specific limits and voice duration/plan limits may still apply.
