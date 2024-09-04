#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define the build directory
BUILD_DIR="dist"

# Ensure we are on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Build the project
npm install
npm run build  # Adjust this command to your build script

# Switch to the gh-pages branch
git checkout gh-pages

# Merge the latest changes from the main branch
git merge main

# Remove all files except the build output
find . -maxdepth 1 ! -name "$BUILD_DIR" ! -name '.git' ! -name '.' -exec rm -rf {} +

# Move the build output to the root
mv $BUILD_DIR/* ./
rm -rf $BUILD_DIR

# Add and commit the changes
git add .
git commit -m "Deploy to GitHub Pages"

# Push the changes to the gh-pages branch
git push origin gh-pages

# Switch back to the main branch
git checkout main

echo "Deployment to GitHub Pages completed successfully."