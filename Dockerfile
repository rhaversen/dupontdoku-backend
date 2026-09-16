FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN useradd -m dupontdoku_backend_user

COPY dist/ ./dist/
COPY package*.json ./

RUN chown -R dupontdoku_backend_user:dupontdoku_backend_user /app

USER dupontdoku_backend_user

RUN npm ci --omit=dev

EXPOSE 5001

CMD ["npm", "start"]
