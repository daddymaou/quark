# Security Policy

## Supported Versions

Only the latest version of QUARK deployed on `master` receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| master  | :white_check_mark: |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities privately via one of the following:

- **GitHub Security Advisories**: [Report a vulnerability](https://github.com/thepalearchitects/quark/security/advisories/new)
- **Email**: security@thepalearchitects.dev

Include as much detail as you can:

- Description of the vulnerability and its potential impact
- Steps to reproduce (Proof of Concept preferred)
- Affected routes, components, or dependencies
- Any suggested remediation, if you have one

## What to Expect

- **Acknowledgement** within 72 hours of your report
- **Status update** within 7 days with initial assessment
- **Resolution timeline** dependent on severity; critical issues prioritized immediately
- **Credit** in the advisory and release notes if you wish to be recognized (optional)

## Scope

In scope:

- Authentication and session handling (Clerk integration)
- Authorization flaws (privilege escalation, IDOR, broken access control)
- Injection vulnerabilities (XSS, especially in the sandboxed preview iframe)
- Sandbox escapes from the code preview environment
- Secrets exposure, insecure data handling
- Dependency vulnerabilities (via `npm audit` / advisories)

Out of scope:

- Reports requiring physical access to a user's device
- Social engineering attacks
- Denial of service (without a concrete amplification vector)
- Vulnerabilities in third-party services (Clerk, Neon, Resend) — report those upstream

## Security Measures in Place

- **Sandboxed preview**: user code runs in an `<iframe sandbox="allow-scripts">` without `allow-same-origin`, isolating host cookies and storage
- **Secret scanning**: Gitleaks runs on every push and pull request via the DevSecOps pipeline
- **Dependency auditing**: `npm audit --audit-level=high` enforced in CI
- **Route protection**: Clerk middleware guards dashboard, editor, settings, billing, and admin routes
- **Admin API guards**: every admin endpoint verifies the caller's role server-side
