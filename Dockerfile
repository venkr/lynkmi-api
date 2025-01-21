# Use official Playwright image which includes all necessary dependencies
FROM mcr.microsoft.com/playwright:v1.41.2-focal

# Install pnpm
RUN npm install -g pnpm

# Create and set working directory
WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN pnpm build

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]