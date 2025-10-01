#!/bin/bash

if [[ "$VERCEL_TARGET_ENV" == 'preview' ]]; then
  JWT_PRIVATE_KEY_ESCAPED=$(printf '%s' "$JWT_PRIVATE_KEY")
  bunx convex env set --preview-name $VERCEL_GIT_COMMIT_REF JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY_ESCAPED"
  bunx convex env set --preview-name $VERCEL_GIT_COMMIT_REF JWKS "$JWKS"
fi