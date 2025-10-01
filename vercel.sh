#!/bin/bash

if [[ "$VERCEL_TARGET_ENV" == 'preview' ]]; then
  npx convex env set --preview-name $VERCEL_GIT_COMMIT_REF JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"
  npx convex env set --preview-name $VERCEL_GIT_COMMIT_REF JWKS "$JWKS"
fi