# --- frontend build ---
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- backend runtime ---
FROM python:3.12-slim
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist

# SQLite data, the security-state file, and the credentials encryption key
# all live outside the app directory so they survive image rebuilds — mount
# a volume at /data (see docker-compose.yml).
ENV FJORD_DATABASE_URL=sqlite:////data/fjord.db
ENV FJORD_SECRETS_PATH=/data/secrets.json
ENV FJORD_CREDENTIALS_KEY_PATH=/data/credentials.key
VOLUME /data

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
