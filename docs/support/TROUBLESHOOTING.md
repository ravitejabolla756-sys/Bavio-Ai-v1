# Troubleshooting

## Calls do not connect

Check Phone Number/provider configuration, country availability, account status, provider credentials, and callback URLs. Do not expose provider secrets in a support ticket.

## Transcript is missing

The call may have ended before transcription, a provider may have failed, or processing may still be incomplete. Check the Conversation status and provider-specific errors.

## Webhook failed

Check endpoint DNS, HTTPS, certificate, redirect behavior, timeout, response status, and signature verification. Review the ActionExecution/Evidence record before retrying.

## Lead data is incomplete

A Lead reflects persisted/captured input. Missing caller details should remain missing; AI inference is not proof.

## Authentication fails

Sign in again, verify the browser token/session, confirm Workspace access, and contact `[SUPPORT_EMAIL]` with a timestamp and safe request ID.
