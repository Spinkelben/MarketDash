

FROM cgr.dev/chainguard/rust:latest-dev AS build
COPY --from=cgr.dev/chainguard/glibc-dynamic:latest / /base-chroot
USER root
RUN apk add --no-cache --no-commit-hooks --root /base-chroot openssl
RUN apk add --no-cache --no-commit-hooks openssl-dev

WORKDIR /app
COPY . .
RUN cargo build --release --manifest-path ./backend-server/Cargo.toml

FROM cgr.dev/chainguard/glibc-dynamic:latest 
ARG PACKAGE=backend-server

COPY --link --from=build /base-chroot /
COPY --from=build --chown=nonroot:nonroot /app/backend-server/target/release/${PACKAGE} /usr/local/bin/app/backend-server/${PACKAGE}
COPY --from=build --chown=nonroot:nonroot /app/front-end /usr/local/bin/app/front-end
WORKDIR /usr/local/bin/app/backend-server
EXPOSE 8000
CMD ["/usr/local/bin/app/backend-server/backend-server"]

