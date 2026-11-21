# AaD 2.0 backend

Spring Boot 3.1.5 / Java 17 REST API backed by PostgreSQL and Spring Security JWT authentication. See the [project README](../README.md) for resident and coordinator workflows.

## Docker quick start

From this directory, copy `.env.example` to `.env`, replace the placeholder credentials and run `docker compose up --build`.

Docker Compose starts PostgreSQL 17 at `127.0.0.1:55432` and the API at `127.0.0.1:8080`. The database and user are both `aad2`. Database files are retained in the `aad2_data` volume.

## Native development

Install Java 17, Maven 3.9.x and PostgreSQL 17. Set `JAVA_HOME` to the Java installation. Create a local PostgreSQL account and database using the interactive `psql` prompt with a PostgreSQL administrator account.

```sql
CREATE USER aad2;
\password aad2
CREATE DATABASE aad2 OWNER aad2;
```

The following PowerShell example uses PostgreSQL's standard local port `5432`. Use `55432` when connecting to the database supplied by this repository's Docker Compose setup.

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://127.0.0.1:5432/aad2'
$env:DATABASE_USERNAME = 'aad2'
$aadDatabasePassword = Read-Host 'Database password' -AsSecureString
$env:DATABASE_PASSWORD = [System.Net.NetworkCredential]::new('', $aadDatabasePassword).Password
$aadRandomBytes = New-Object byte[] 48
$aadGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$aadGenerator.GetBytes($aadRandomBytes)
$aadGenerator.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($aadRandomBytes)
$env:ADMIN_EMAIL = 'coordinator@example.invalid'
$aadAdministratorPassword = Read-Host 'New administrator password (12-72 ASCII characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $aadAdministratorPassword).Password
$env:SEED_DEMO = 'false'
mvn spring-boot:run
```

Reuse the same JWT secret when restarting an existing development instance to keep its current tokens valid. Store a persistent local value in your own ignored configuration if required.

With Bash or another shell, export the same variables before launching Maven. Spring Boot reads the supplied environment and the tracked `src/main/resources/application.properties`. Docker Compose's `.env` parsing applies when Compose launches the service.

## Build and checks

```bash
mvn clean verify
```

Run the packaged API with `java -jar target/drain-adoption-0.0.1-SNAPSHOT.jar` from the same configured shell. On first connection, Hibernate creates or updates the schema. The deployment uses `ddl-auto=update`.

`GET /api/drains` is the deployment health-check endpoint. `GET /api/locations` lists published locations. A fresh database can return an empty list until a coordinator publishes an entry.

See [configuration and access](../SECURITY_SETUP.md) and [Render deployment](../DEPLOY_RENDER_PILOT.md) for environment settings. Current photos, reports, public locations and shared adoptions use PostgreSQL. Older private-photo records can reference `UPLOAD_DIRECTORY`.
