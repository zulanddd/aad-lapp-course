# Configuration, access and data handling

## Local configuration

Copy each component's `.env.example` to `.env` and fill in your own values. Docker Compose loads the backend `.env`. React Scripts loads the frontend `.env`. Native Spring Boot needs variables exported into its launching shell, as explained in the [backend guide](drain-adoption/README.md).

The tracked `application.properties` contains environment-variable references and local development defaults. Keep actual passwords and secrets in ignored local files or hosting settings.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | JDBC URL for native or Docker-based PostgreSQL access |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Your database account |
| `JWT_SECRET` | Random signing secret of at least 32 bytes |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial administrator account |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed to call the API |
| `SEED_DEMO` | Enables the inherited demonstration drain seed when explicitly desired |
| `REPORT_PHOTOS_ENABLED` | Enables optional private report photos |
| `UPLOAD_DIRECTORY` | Storage location for legacy filesystem-backed report photos |

`RENDER_DATABASE_CONNECTION` takes priority for database configuration when supplied by the Render Blueprint.

## Accounts and permissions

Registration creates an ordinary resident account. Coordinator endpoints require an administrator role verified against the database. Adoption uses the authenticated account's identity. Multiple accounts can adopt the same location, and retries preserve one adoption per account/location pair.

JWTs expire after 24 hours. A cached browser menu can still show account controls after a token expires. If protected requests return `401` or `403`, sign in again and check the account role.

Bootstrap creates an administrator only when the configured email is absent. Editing its environment password does not change an existing account's stored password. Use independent credentials for local development and hosting.

## Report links and media

Each account-free report has a private tracking credential. The web link contains it after `#token=`. The client sends it using `X-Report-Token` when requesting details or the photo. Administrators can access those resources using their bearer token.

Treat the complete private link as access to that report. Keep it out of public posts and screenshots. Public map entries are separately prepared and published by coordinators.

Report photos and public-location photos have separate database records. Private photos are resized and stripped of metadata. Public photos are resized and re-encoded. The administrator confirms that a public photo matches its location and is suitable for publication.

## Browser configuration

Every `REACT_APP_*` value becomes part of the built frontend. A Google Maps browser key is visible to visitors and should use appropriate website-origin and API restrictions. Database passwords, JWT secrets and administrator credentials belong to the backend environment.

Frontend and API origins must match the CORS and frontend API URL settings. The hosted application uses HTTPS addresses.

## Course data

The hosted trial requests test information. Reports are reviewed by the student project team, and municipal integration remains a future project question. Survey participation and consent records are managed separately from website accounts.

Before sharing a copy of the repository, check its files and Git history for real credentials, database exports, resident information and private media. Review access and retention requirements again when moving beyond the course trial.
