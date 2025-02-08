FROM node:16-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Then copy the rest of the files
COPY . .

# Start the app
CMD ["npm", "start"] 