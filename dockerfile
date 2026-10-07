FROM node:22-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm@11

ENV CI=true

COPY package.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml ./
COPY prisma ./prisma/

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]