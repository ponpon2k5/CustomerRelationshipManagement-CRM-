# Render Deploy Notes

Use these settings when creating the backend as a Render Web Service.

## Service

- Type: Web Service
- Root Directory: `backend`
- Runtime: Java
- Build Command: `chmod +x mvnw && ./mvnw clean package -DskipTests`
- Start Command: `java -jar target/crm-0.0.1-SNAPSHOT.jar`

If the exact jar name changes, use:

```bash
java -jar target/*.jar
```

## Environment Variables

Set these in Render under Environment:

```text
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require&preferQueryMode=simple&prepareThreshold=0
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
GEMINI_API_KEY=<gemini-api-key>
```

Render provides `PORT` automatically. The backend reads it with `server.port=${PORT:8080}`.

## Frontend

After the backend is live, copy the Render URL and set this variable in Vercel:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

Then redeploy the Vercel frontend.
