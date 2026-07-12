FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY apps/api/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY apps/api/src ./src

# Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/app.js"]