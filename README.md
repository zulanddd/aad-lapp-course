# Adopt a Drain 2.0 — Lappeenranta

A bilingual Sustainable Cities course project by Group LAPP AaD1. Residents can explore drain observations, adopt published locations together, and send reports with optional photos. The student team reviews reports and provides feedback.

[Visit the website](https://aad-lapp-course.onrender.com/) · [Run locally](#run-locally) · [Deploy on Render](DEPLOY_RENDER_PILOT.md) · [Configuration and access](SECURITY_SETUP.md)

## Project background

This project continues the [2025 Group 11 Adopt-a-Drain project](https://github.com/emilypekarski-netizen/Project-Uni). Version 2.0 extends participation to residents across Lappeenranta, including students and non-students. It adds a redesigned English/Finnish interface, published map locations, shared adoption, account-free reporting and private feedback.

The hosted website is a course trial using test data. Reports are handled by the student team. Municipal integration and flood-reduction outcomes remain areas for future evaluation. Finnish text is a draft pending human review.

## Resident features

- Browse a Google map and a matching list of published locations without an account.
- View photos, observation dates, descriptions and coordinates. Categories cover drain locations, blocked drains, standing water, damaged drains and other observations.
- Create an account and adopt published locations. A resident can adopt several locations, and several residents can adopt the same location.
- Cancel your own adoption and retain adoption status across page reloads and sign-ins.
- Submit an observation without an account or adoption. Enter a street or landmark, choose the issue and time, add a description and optionally attach one JPG/PNG photo up to 5 MB.
- Choose map coordinates or use device location when available. Text entry remains available when maps or device location fail.
- Save the private report link to view report details, photos, status and feedback.

Adoption means continuing to observe a location safely. Participants can observe from a safe place and report changes, without taking on cleaning or repair duties.

## Coordinator features

- Sign in with an administrator account to access **Manage locations** and **Review reports**.
- Review observations and photos, update the review status and write feedback or a closure reason.
- Create public locations with English/Finnish names and descriptions, observation type and date, coordinates and a team photo.
- Save drafts, preview public cards, publish, edit or withdraw locations.
- Prepare a separate public entry after checking an observation. Original resident reports and their photos stay private.
- Export anonymous report metadata as CSV for course analysis.

Withdrawing a location or saving it as a draft ends its active adoptions. Publishing it again makes it available for fresh adoption. Editing an entry while keeping it published preserves adoptions.

## Report workflow

1. A resident submits an observation and saves the generated private link.
2. A coordinator reviews it and records feedback.
3. The resident checks the link for updates.
4. The team can prepare a separate public location for the map after verification.

Statuses are **Received → Under review → Feedback provided → Closed**. They describe the team's review activity. A closure reason explains why a report was closed. Physical repair and municipal action require their own verification.

## Architecture and repository structure

The React frontend calls a Spring Boot REST API. Spring Security and JWT handle account access, Hibernate/JPA persists data in PostgreSQL, and Google Maps JavaScript API supplies the map.

Current public-location and private-report photos are stored in PostgreSQL. Private photos are resized, stripped of image metadata and restricted to the private-link holder or an administrator. Public photos use separate records. Render hosts the static frontend, Docker-based API and PostgreSQL database.

```text
drain-adoption-frontend/    React application and frontend environment template
  src/aad/                Current resident and coordinator interface
  src/components/         Components inherited from the 2025 project
drain-adoption/            Spring Boot API, Maven build and Docker Compose
  src/main/java/          Controllers, entities, repositories and authentication
  src/main/resources/     Environment-driven application configuration
docs/legacy/              Archived 2025 project and deployment documentation
render.yaml               Render Blueprint and service build settings
DEPLOY_RENDER_PILOT.md    Current Render deployment instructions
SECURITY_SETUP.md         Current configuration, access and data-handling guide
```

Run frontend package commands inside `drain-adoption-frontend/`.

## Run locally

### Requirements

- Git and Docker with Docker Compose v2 for the database/API quick start.
- Node.js 24.x and pnpm 11.25.0 for the frontend, matching the Render build configuration.
- For the native backend alternative, Java 17 and Maven 3.9.x, plus PostgreSQL 17.

### 1. Clone and configure the backend

```bash
git clone https://github.com/zulanddd/aad-lapp-course.git
cd aad-lapp-course/drain-adoption
cp .env.example .env
```

Edit `.env` and set a new database password, a randomly generated JWT secret of at least 32 bytes, and your own administrator email and password. The bootstrap administrator password needs 12–72 ASCII characters. Keep the database password when reusing an existing database volume.

```bash
docker compose up --build
```

The API listens at `http://127.0.0.1:8080`. Its read-only check endpoint is `http://127.0.0.1:8080/api/drains`. PostgreSQL is exposed locally at port `55432`, with database/user `aad2`. Docker volumes retain the database between restarts.

The first start creates the configured administrator if that email is absent. Changing `ADMIN_PASSWORD` later does not reset an existing account. Newly registered residents receive the ordinary resident role.

### 2. Start the frontend in another terminal

```bash
cd aad-lapp-course/drain-adoption-frontend
cp .env.example .env
npx --yes pnpm@11.25.0 install --frozen-lockfile
npx --yes pnpm@11.25.0 start
```

Open `http://localhost:3000`. The frontend template points to `http://127.0.0.1:8080`. Set your own Google Maps JavaScript API key to enable the map. The template keeps the course-trial banner enabled.

To make a production build, run `npx --yes pnpm@11.25.0 run build` from the frontend directory. Frontend environment variables are embedded at build time.

### Native backend alternative

See the [backend README](drain-adoption/README.md) for a PostgreSQL and Maven setup with explicit environment variables.

## API overview

| Capability | Endpoint |
| --- | --- |
| Register / sign in | `POST /api/auth/register`, `POST /api/auth/login` |
| Published locations and photos | `GET /api/locations`, `GET /api/locations/{id}`, `GET /api/locations/{id}/photo` |
| Current account's adoptions | `GET /api/me/location-adoptions` |
| Adopt / cancel adoption | `PUT /api/locations/{id}/adoption`, `DELETE /api/locations/{id}/adoption` |
| Submit an observation | `POST /api/reports` using multipart form data |
| Read a private report / photo | `GET /api/reports/{id}`, `GET /api/reports/{id}/photo` |
| Coordinator location management | `GET/POST /api/admin/locations`, `PUT /api/admin/locations/{id}` |
| Withdraw a location | `PUT /api/admin/locations/{id}/withdraw` |
| Coordinator report review | `GET /api/admin/reports`, `PUT /api/admin/reports/{id}` |
| Anonymous metadata CSV | `GET /api/admin/reports/export` |

Account operations use `Authorization: Bearer <token>`. Private report requests use `X-Report-Token` from the saved private link, or an administrator's bearer token. The browser keeps the private credential in the link fragment after `#` and supplies it to the API as a header.

## Deployment and troubleshooting

Follow [Render pilot deployment](DEPLOY_RENDER_PILOT.md) to configure the Blueprint. Store deployment credentials in the hosting environment. Check the current plan and database expiry in Render.

- An empty public map can mean the coordinator has not published locations yet. Publishing requires a photo, both languages and the confirmation checkbox.
- A `401` or `403` response on a protected action can indicate an expired login or insufficient permissions. Sign in again with the appropriate account. Tokens expire after 24 hours.
- If a free API service has been idle, its next request may wait for it to wake up.
- If Google Maps is unavailable, verify the key, enabled API and allowed website origins. Rebuild the frontend after changing its environment.
- Private report photos have a total allowance of 128 MiB in this prototype. Text-only reporting remains available when that allowance is full.

## Attribution and license information

The foundation is the [2025 repository by emilypekarski-netizen](https://github.com/emilypekarski-netizen/Project-Uni). Its README credits Fabian González as developer and Emily Pekarski as project manager. The [archived upstream README](docs/legacy/UPSTREAM_README.md) preserves that description and attribution. Group LAPP AaD1 developed the current 2.0 prototype with AI-assisted development.

The upstream README describes an educational university project, and the upstream repository has no explicit license file. This repository records that licensing status. Reuse or redistribution should be based on permission from the relevant rights holders.

The reference homepage photograph is [Stormwater Drain by Panelxf](https://commons.wikimedia.org/wiki/File:Stormwater_Drain.jpg), published on Wikimedia Commons under CC0. Its attribution is also displayed on the website.
