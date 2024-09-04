#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define the build directory
BUILD_DIR="dist"

# Ensure we are on the main branch
git checkout main

# Pull the latest changes with fast-forward only
git pull origin main --ff-only

# Switch to the gh-pages branch
git checkout gh-pages

# Reset gh-pages to match main
git reset --hard main

# Build the project
npm install
npm run build  # Adjust this command to your build script

# Add and commit the changes
git add .
git commit -m "Deploy to GitHub Pages"

# Push the changes to the gh-pages branch
git push origin gh-pages --force