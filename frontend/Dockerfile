FROM node:22-alpine

WORKDIR /app

# Copy package management files to leverage layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Set up build arguments for public environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build the production Next.js bundle
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
