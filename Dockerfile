FROM nginx:1-alpine

ARG GIT_COMMIT
ARG VERSION

LABEL description="Manufacturing showcase." \
    git_commit="${GIT_COMMIT}" \
    org.opencontainers.image.authors="baptiste@3dverse.com" \
    version="${VERSION}"

WORKDIR /usr/share/nginx/html
COPY --chown=nginx ./out/ .
COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
