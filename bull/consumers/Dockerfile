FROM node:18-slim
WORKDIR /bull/consumers
COPY . .
RUN yarn install --production
EXPOSE 3001
CMD ["node", "index.js"]