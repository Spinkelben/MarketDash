

FROM cgr.dev/chainguard/rust:latest-dev AS build

WORKDIR /app
COPY . .

USER root
RUN apk add openssl-dev
RUN cargo build --release --manifest-path ./backend-server/Cargo.toml

FROM cgr.dev/chainguard/glibc-dynamic:latest 
ARG PACKAGE=backend-server

COPY --from=build --chown=nonroot:nonroot /app/backend-server/target/release/${PACKAGE} /usr/local/bin/app/backend-server/${PACKAGE}
COPY --from=build --chown=nonroot:nonroot /app/front-end /usr/local/bin/app/front-end
CMD ["/usr/local/bin/app/backend-server/backend-server"]

