#!/usr/bin/env sh
# Simple script to generate a self-signed CA cert at certs/ca.pem
set -eu
mkdir -p "$(dirname "$0")/../certs"
CA_DIR="$(pwd)/certs"
if [ -f "$CA_DIR/ca.pem" ]; then
  echo "CA cert already exists at $CA_DIR/ca.pem"
  exit 0
fi
echo "Generating self-signed CA cert in $CA_DIR"
openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
  -keyout "$CA_DIR/ca-key.pem" -out "$CA_DIR/ca.pem" -subj "/CN=MAPDashboard Local CA"
chmod 644 "$CA_DIR/ca.pem"
echo "Created $CA_DIR/ca.pem"
