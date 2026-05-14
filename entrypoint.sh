#!/bin/sh
mkdir -p /app/data
chown -R appuser:nodejs /app/data
exec su-exec appuser "$@"
