FROM cgr.dev/chainguard/node:latest-dev AS builder

# NPM registry auth token
ARG NPM_TOKEN

# Switch to root for package installation
USER root

# Create app directory and set ownership
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN apk add --no-cache --virtual .build-deps \
    build-base \
    python3 \
    openjdk-17-jre

# Ensure Java is in PATH for all users
ENV PATH="/usr/lib/jvm/java-17-openjdk/bin:${PATH}"

COPY .npmrc .npmrc

RUN npm config set @3dverse:registry="https://gitlab.com/api/v4/packages/npm/" --userconfig=".npmrc" && \
    npm config set //gitlab.com/api/v4/packages/npm/:_authToken="${NPM_TOKEN}" --userconfig=".npmrc"

# Install app dependencies
COPY package*.json ./

# Set ownership of the app directory to node user
RUN chown -R node:node /usr/src/app

# Switch to node user for npm operations
USER node

# Install dependencies
RUN npm install --allow-remote=all

# Bundle app source with correct ownership
COPY --chown=node:node . .

# Build the application (now all files are owned by node user)
RUN npm run build && \
    npm pack && \
    tar -zxf showcase-manufacturing-*.tgz

# Remove dev dependency packages
RUN npm prune --production

# Clean up build dependencies after build is complete
USER root
RUN apk del .build-deps
USER node

FROM gcr.io/distroless/nodejs24-debian12
ENV NODE_ENV="production"

LABEL description="Manufacturing showcase." \
    git_commit="${GIT_COMMIT}" \
    version="${VERSION}"

# Copy file from the builder stage
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package .

EXPOSE 3000
EXPOSE 3001

# Run the application
CMD ["server/dist/server/sources/main.js"]
