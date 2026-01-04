#!/bin/bash

# Script to reorganize project-3 images into the new directory structure
# Run this from the NGO_web root directory

echo "Starting project-3 image reorganization..."

# Create new directory structure
echo "Creating directories..."
mkdir -p public/images/projects/project-3/card
mkdir -p public/images/projects/project-3/details
mkdir -p public/images/projects/project-3/receipts
mkdir -p public/images/projects/project-3/results

# Move detail images (shelter visit photos)
echo "Moving detail images..."
if [ -f "public/images/projects/project-3/shelter-visit-1.webp" ]; then
  mv public/images/projects/project-3/shelter-visit-1.webp public/images/projects/project-3/details/
fi
if [ -f "public/images/projects/project-3/shelter-visit-2.webp" ]; then
  mv public/images/projects/project-3/shelter-visit-2.webp public/images/projects/project-3/details/
fi
if [ -f "public/images/projects/project-3/shelter-visit-3.webp" ]; then
  mv public/images/projects/project-3/shelter-visit-3.webp public/images/projects/project-3/details/
fi

# Move receipt images
echo "Moving receipt images..."
for i in {1..7}; do
  if [ -f "public/images/projects/project-3/receipt-$i.webp" ]; then
    mv public/images/projects/project-3/receipt-$i.webp public/images/projects/project-3/receipts/
  fi
done

# Results are already in the results subfolder from previous work
# Just verify they exist
echo "Verifying results images..."
if [ -d "public/images/projects/project-3/results" ]; then
  result_count=$(ls -1 public/images/projects/project-3/results/*.webp 2>/dev/null | wc -l)
  echo "Found $result_count result images"
else
  echo "Warning: results directory not found!"
fi

echo "Image reorganization complete!"
echo ""
echo "Directory structure:"
echo "public/images/projects/project-3/"
echo "├── card/          (project card background - add manually)"
echo "├── details/       (shelter visit photos)"
echo "├── receipts/      (receipt images)"
echo "└── results/       (project outcome photos)"
echo ""
echo "Next steps:"
echo "1. Manually add a project card background image to: public/images/projects/project-3/card/bg.webp"
echo "2. Verify all images are in the correct folders"
echo "3. Test the website to ensure all images load correctly"
