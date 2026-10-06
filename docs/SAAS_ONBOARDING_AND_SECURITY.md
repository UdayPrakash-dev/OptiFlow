# SaaS Onboarding & Security Architecture

This document tracks the critical edge cases, security measures, and architectural decisions we are making for the OptiFlow onboarding flow. It serves as a guide for the engineering team to understand *why* certain restrictions exist.

## 1. Business Email Validation (Anti-Spam / Imposter Prevention)
**Status:** ✅ Implemented
**Location:** `back-end-new/src/controllers/auth.controller.js` -> `handleRegisterCompany()`

**Why we need it:** 
OptiFlow is a B2B (Business-to-Business) SaaS. We cannot allow users to register companies using personal, free email addresses (e.g., `@gmail.com`, `@yahoo.com`). 
*Note on Edge Cases:* A user might ask: "If a Google employee logs in, do they need Gmail?" No. A Google employee using SaaS for business uses their corporate domain: `@google.com`. A consumer uses `@gmail.com`. We differentiate them by maintaining a blocklist of free consumer domains and blocking them at registration.

**How it works:**
During the registration flow, the backend checks the domain of the provided `ownerEmail` against a hardcoded blocklist of known free email providers. If it matches, the API rejects the request with a `400 Bad Request` and forces the user to provide a valid corporate work email.

## 2. Feature Gating (Plan Limitations)
**Status:** ✅ Implemented
**Location:** `src/controllers/users.controller.js` (and enforced in middleware)

**Why we need it:**
When a company signs up, they receive a 14-Day Free Trial that maps to a specific `Plan`. If we do not actively enforce the limits of that plan (e.g., `maxUsers`), malicious users could invite 10,000 employees on a free tier and drain our server resources.

**How it works:**
Whenever a user attempts an action that consumes resources (e.g., inviting a user), we check the database to count their current usage against the `maxUsers` defined in their `Subscription.Plan`. If the limit is reached, a `403 Forbidden` error is returned.

## 3. Rate Limiting (DDoS & Botnet Protection)
**Status:** ⏳ Pending Implementation
**Location:** To be implemented on public routes (e.g., `/auth/register-company`, `/auth/login`)

**Why we need it:**
Without rate limiting, a bot could script thousands of requests to the registration endpoint per minute, filling the database with garbage data and causing an outage for real users.

**How it works:**
We will implement an IP-based rate limiter (e.g., `express-rate-limit`) that only allows a maximum of 3 to 5 registration attempts per IP address per hour.

## 4. Email Verification (OTP / Magic Links)
**Status:** ✅ UI Mocked (Backend logic pending email service)
**Location:** `react_frontend/src/features/common/pages/Register.jsx`

**Why we need it:**
Even with business email validation, a user could type `satya@microsoft.com` and falsely claim that workspace. We must verify they actually have access to that inbox.

**How it works:**
Since we do not have an actual SMTP server (like SendGrid or AWS SES) configured yet, we have implemented the *UI flow* for email verification. 
Instead of instantly redirecting to the dashboard after a successful registration API call, the React component uses a state variable (`verificationSent`) to render a "Check your email" screen. 
This trains the engineering team on the correct UX flow. A "Dev Bypass" button is included on this screen to allow developers to skip the verification and enter the app during testing.
