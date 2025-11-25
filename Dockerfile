

FROM cgr.dev/chainguard/rust:latest-dev AS build

WORKDIR /app
COPY . .

USER root
RUN apk add openssl-dev
RUN cargo build --release --manifest-path ./backend-server/Cargo.toml

FROM cgr.dev/chainguard/static 
ARG PACKAGE=backend-server

COPY --from=build --chown=nonroot:nonroot /app/backend-server/target/release/${PACKAGE} /usr/local/bin/${PACKAGE}
CMD ["/usr/local/bin/${PACKAGE}"]

