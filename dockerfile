FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /klbot
COPY . .
RUN npm install --production --silent
RUN npx prisma db pull && npx prisma generate
CMD ["npm", "start"]
