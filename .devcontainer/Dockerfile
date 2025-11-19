FROM node:20-alpine

# Install essential development tools
RUN apk add --no-cache \
    git \
    openssh-client \
    bash \
    curl \
    ca-certificates \
    docker-cli \
    docker-compose \
    sudo

# Configure the node user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Give node user sudo access without password for fixing permissions
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Configure git to be safe with the workspace
RUN git config --system --add safe.directory '*' \
    && git config --system core.fileMode false

# Set up shell
ENV SHELL=/bin/bash

# Install global npm packages for development
RUN npm install -g npm@latest

# Workspace will be mounted here by docker-compose
WORKDIR /workspace

USER $USERNAME
