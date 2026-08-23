# syntax=docker/dockerfile:1.7
FROM node:22.23.2-bookworm-slim AS build
WORKDIR /app
COPY --link package.json package-lock.json .nvmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY --link . .
RUN npm run build && npm prune --omit=dev

FROM node:22.23.2-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4310
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /var/lib/folio/tenants /var/lib/folio/attachments /var/backups/folio \
    && chown -R node:node /var/lib/folio /var/backups/folio
USER node
EXPOSE 4310
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=4 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4310/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
