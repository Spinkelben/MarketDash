

# Build Stage for Backend
FROM cgr.dev/chainguard/rust:latest-dev AS backend-build
COPY --from=cgr.dev/chainguard/glibc-dynamic:latest / /base-chroot
USER root
RUN apk add --no-cache --no-commit-hooks --root /base-chroot openssl openssl-dev

WORKDIR /app
COPY . .
ENV OPENSSL_DIR=/base-chroot/usr
RUN cargo build --release --manifest-path ./backend-server/Cargo.toml

# Build Stage for Vue Frontend
FROM denoland/deno:alpine AS vue-build
WORKDIR /app
COPY front-end-vue/deno.json front-end-vue/deno.lock front-end-vue/package.json ./
RUN deno install --node-modules-dir
COPY front-end-vue/ .
RUN deno task build

# Final Stage
FROM cgr.dev/chainguard/glibc-dynamic:latest 
ARG PACKAGE=backend-server

COPY --link --from=backend-build /base-chroot /
COPY --from=backend-build --chown=nonroot:nonroot /app/backend-server/target/release/${PACKAGE} /usr/local/bin/app/backend-server/${PACKAGE}
COPY --from=vue-build --chown=nonroot:nonroot /app/dist /usr/local/bin/app/front-end-vue/dist
WORKDIR /usr/local/bin/app
EXPOSE 8000
CMD ["/usr/local/bin/app/backend-server/backend-server"]

