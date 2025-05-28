FROM node:18-slim

# Establece el directorio de trabajo en /app
WORKDIR /api

# Copia los archivos del proyecto al contenedor
COPY . .

# Instala las dependencias del proyecto
RUN yarn install --production

# Expone el puerto que la aplicación usa
EXPOSE 3000


# Comando para iniciar la aplicación
CMD ["node", "src/app.js"]