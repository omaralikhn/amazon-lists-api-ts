## Problem

The library reads Alexa lists only when its caller supplies an authenticated Amazon session. A copied browser session is not dependable for scheduled use because its expiry and revocation are unpredictable, while Amazon may also challenge automated sign-in with MFA, CAPTCHA, or device approval.

## Goal

Prove that a local unattended process can authenticate to the user's Amazon account and read the real Alexa `SHOP` list without exposing credentials, before any scheduler or broader automation is built.

## Proof outcome

* The **2026-10-11 local proof** established an `amazon.com` registered-device session through an authenticator-app challenge, fetched the `SHOP` list, refreshed the session, and fetched the list types again.
* A separate **unattended rerun** loaded the saved registration state, refreshed it, and completed the same two list requests without browser login or MFA.

## Assumptions and dependencies

* The proof depends on Amazon continuing to accept the **private Alexa list endpoints** used by the library.
* The proof depends on the user's **Amazon marketplace and MFA method** supporting the selected local authentication path.
* The proof runs only on a **user-controlled machine** with credentials stored outside the repository.
* Amazon may require an **interactive challenge** that prevents fully unattended authentication.

## Requirements

### Proof scope

* The proof must obtain a **fresh authenticated session** without manually replacing a browser cookie.
* The proof must call the existing **read-only list API** and identify the Alexa list whose type is `SHOP`.
* The proof must make a **second authenticated request** to establish whether the resulting session remains usable.
* The proof must record only **redacted operational evidence**, including outcome, HTTP status, discovered list names and types, and any challenge category.

### Credential protection

* The proof must keep Amazon passwords, session cookies, MFA codes, and TOTP seeds out of **chat, source control, logs, errors, fixtures, and results**.
* The proof must use a **local secrets file** outside the repository with owner-only permissions.
* The proof must document **credential rotation and revocation** steps before a real account run.
* The library must remain free of **credential persistence and login behavior**.

### Authentication boundary

* The authentication behavior must remain separate from **Alexa list parsing and transport**.
* The proof must support a **clear failure result** for bad credentials, unsupported MFA, CAPTCHA, device approval, `401` responses, and endpoint incompatibility.
* The proof must stop rather than retrying aggressively when Amazon presents an **account-security challenge**.

### Testability

* Authentication and session behavior must be testable with **injected transport and redacted fixtures**.
* The proof must not capture or commit **live Amazon traffic** containing account data or credentials.

## Open questions

* The proof host remains the user's **Mac**, while any always-on host remains untested.
* The **scheduled runtime shape and cadence** remain deferred until the local proof script has a durable operational owner.

## Deferred

* A **scheduler, `launchd` configuration, CLI, write operations, and broad automation** are excluded until the proof succeeds.
* Any **production runtime shape** beyond the proof is excluded until the authentication behavior is shown to be durable enough for scheduled use.

## Reference

* The [amazon-lists-api-ts repository](https://github.com/omaralikhn/amazon-lists-api-ts) provides the existing **read-only client and private transport boundary**.
* The [private Alexa list transport reference](../refs/private-alexa-list-transport.md) defines the current **endpoint contract, local proof behavior, and unsupported status**.
* [`scripts/prove-auth.ts`](../scripts/prove-auth.ts) owns the **loopback authentication and session-refresh proof**.
* [pyalexatodo](https://github.com/lonlazer/pyalexatodo) is the **protocol precedent** for the current endpoint shapes.

## Acceptance criteria

* A local proof obtains a **session without a browser cookie** and reads the account's `SHOP` list.
* A **second authenticated request** succeeds or reports a redacted actionable source failure.
* The proof output identifies **success or an explicit failure category** without disclosing credentials or session material.
* The repository remains **read-only**, and its core list client does not acquire credential storage or login behavior.
* A **security challenge or unsupported authentication path** stops the proof without repeated automated attempts.
