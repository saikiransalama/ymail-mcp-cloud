# ADR 006 — AES-256-GCM Envelope Encryption for Credentials

## Status
Accepted

## Context
Yahoo email + app password pairs must be stored in the database for use in server-side IMAP/SMTP connections. Storing them in plaintext is unacceptable.

## Decision
Use AES-256-GCM envelope encryption with a master key from the environment. Each credential set is encrypted with a unique random IV.

## Encryption Model
```
MASTER_KEY (env, 64 hex chars = 32 bytes)
  ↓
per-encryption: crypto.randomBytes(12) → IV (12 bytes)
  ↓
AES-256-GCM encrypt(JSON.stringify({email, appPassword}), MASTER_KEY, IV)
  ↓
store: { encrypted_secret_blob: hex(ciphertext), iv: hex(IV), auth_tag: hex(tag) }
```

## Security Properties
- **Confidentiality**: AES-256 ensures the ciphertext is computationally infeasible to reverse without the key
- **Integrity**: GCM authentication tag detects tampering or corruption
- **Uniqueness**: Random IV per encryption prevents ciphertext correlation across rows
- **Key isolation**: Master key lives only in environment — never in DB, never in logs
- **Decrypt on demand**: Credentials are decrypted only inside `YahooAppPasswordProvider`, never returned to callers

## Key Management
- V1: Master key as env variable (suitable for single-server deployments)
- Future: Replace with AWS KMS, HashiCorp Vault, or GCP Secret Manager for key rotation

## Alternatives Considered
- Symmetric encryption without auth tag (e.g., AES-CBC) — rejected: no integrity protection
- Per-user keys — more complex, not needed at this scale
- KMS in V1 — adds external dependency, overkill for portfolio showcase

## Consequences
- Loss of `MASTER_KEY` = permanent loss of all stored credentials (users must reconnect)
- Key rotation requires decrypting and re-encrypting all credential rows
- Must ensure `MASTER_KEY` is backed up securely in production
