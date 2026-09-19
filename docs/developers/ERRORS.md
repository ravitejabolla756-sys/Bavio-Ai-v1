# API Errors

Clients should handle structured HTTP errors without exposing internal stack traces or secrets. Common categories include invalid request, authentication failure, tenant/ownership failure, missing configuration, provider failure, timeout, rate/usage restriction, and uncertain action state.

Persisted execution failure codes are bounded technical identifiers. Do not retry a mutating Action solely because a client received a network timeout; first reconcile its ActionExecution/Evidence according to the deployed contract.
