# Use the official Node.js image as a base
FROM node:22

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the Vite development server
CMD ["npm", "run", "dev","--","--host","0.0.0.0"]
