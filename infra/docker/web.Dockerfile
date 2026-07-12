FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY apps/web/package.json apps/web/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY apps/web/src ./src

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]