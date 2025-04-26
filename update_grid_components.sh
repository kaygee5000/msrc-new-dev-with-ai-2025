#!/bin/bash

# Create a backup directory
mkdir -p grid-migration-backup

# Find all JavaScript files in the src directory
find src -type f -name "*.js" | while read file; do
  # Create a backup of the original file
  cp "$file" "grid-migration-backup/$(basename $file).bak"
  
  # Replace Grid item xs={number} sm={number} md={number} pattern with new format
  # This handles the case with multiple breakpoints
  perl -i -pe "s/<Grid(\s+)item(\s+)xs=\{(\d+)\}(\s+)sm=\{(\d+)\}(\s+)md=\{(\d+)\}/<Grid size={{ xs: $3, sm: $5, md: $7 }}/g" "$file"
  perl -i -pe "s/<Grid(\s+)item(\s+)xs=\{(\d+)\}(\s+)sm=\{(\d+)\}/<Grid size={{ xs: $3, sm: $5 }}/g" "$file"
  perl -i -pe "s/<Grid(\s+)item(\s+)xs=\{(\d+)\}/<Grid size={{ xs: $3 }}/g" "$file"
  
  # Handle Grid components without "item" prop
  perl -i -pe "s/<Grid(\s+)xs=\{(\d+)\}(\s+)sm=\{(\d+)\}(\s+)md=\{(\d+)\}/<Grid size={{ xs: $2, sm: $4, md: $6 }}/g" "$file"
  perl -i -pe "s/<Grid(\s+)xs=\{(\d+)\}(\s+)sm=\{(\d+)\}/<Grid size={{ xs: $2, sm: $4 }}/g" "$file"
  perl -i -pe "s/<Grid(\s+)xs=\{(\d+)\}/<Grid size={{ xs: $2 }}/g" "$file"
  
  # Handle boolean xs prop (xs without value translates to "grow")
  perl -i -pe "s/<Grid(\s+)item(\s+)xs(\s+)/<Grid size=\"grow\" /g" "$file"
  perl -i -pe "s/<Grid(\s+)xs(\s+)/<Grid size=\"grow\" /g" "$file"
  
  # Remove remaining "item" props since they are no longer needed
  perl -i -pe "s/<Grid(\s+)item(\s+)/<Grid /g" "$file"
  
  echo "Processed $file"
done

echo "Grid migration complete. Original files are backed up in grid-migration-backup directory."

