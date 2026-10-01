# CAScad dev tasks. Run `just` to list recipes.
# Requires: bun (https://bun.sh), just (https://github.com/casey/just)

# Default: show available recipes
default:
    @just --list

# Install dependencies
install:
    bun install

# Build the static PWA into dist/
build:
    bun run build

# Serve built dist/ on localhost
serve port='3000':
    PORT={{port}} bun run scripts/serve.ts

# Build then serve dist/ on 0.0.0.0 for cross-device (LAN) testing
serve-lan port='3000':
    bun run build
    HOST=0.0.0.0 PORT={{port}} bun run scripts/serve.ts

# Run the test suite
test:
    bun test

# Type-check without emitting
check:
    bun run typecheck

# Everything to run before a commit
preflight: check test build
    @echo "typecheck + tests + build passed"
