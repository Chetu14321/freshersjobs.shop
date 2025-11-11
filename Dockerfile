# Use the official Node.js LTS image as the base
FROM node:18

# Create a working directory for your app inside the container
WORKDIR /app

# Copy the package.json and package-lock.json to install dependencies first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose port 3000 (or whatever port your app runs on)
EXPOSE 3000

# Start the app when the container runs
CMD ["npm", "start"]
