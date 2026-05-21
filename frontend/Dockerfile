FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
ENV NEXT_PUBLIC_API_URL=http://82.147.67.216:4000
ENV NEXT_PUBLIC_WS_URL=http://82.147.67.216:4000
RUN npx next build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm ci --omit=dev --ignore-scripts
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start"]
