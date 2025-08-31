#!/usr/bin/env python3
"""
Script to change 'categories:' to 'tags:' in markdown files.
Changes from:
  categories: 
    - "portfolio"
To:
  tags: portfolio

Usage: python3 update_categories_to_tags.py
"""

import os
import re
from pathlib import Path

def update_file(file_path):
    """Update a single markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match categories with portfolio
        pattern = r'categories:\s*\n\s*-\s*"portfolio"'
        replacement = 'tags: portfolio'
        
        # Check if the pattern exists
        if re.search(pattern, content):
            # Make the replacement
            new_content = re.sub(pattern, replacement, content)
            
            # Write the updated content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to update all markdown files."""
    posts_dir = Path("_posts")
    
    if not posts_dir.exists():
        print("Error: _posts directory not found!")
        return
    
    updated_files = []
    total_files = 0
    
    print("Searching for markdown files with 'categories: portfolio'...")
    
    # Walk through all markdown files
    for md_file in posts_dir.rglob("*.md"):
        total_files += 1
        if update_file(md_file):
            updated_files.append(str(md_file))
            print(f"Updated: {md_file}")
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Update complete!")
    print(f"Files processed: {total_files}")
    print(f"Files updated: {len(updated_files)}")
    
    if updated_files:
        print(f"\nUpdated files:")
        for file_path in updated_files:
            print(f"  {file_path}")
    
    print(f"\nAll 'categories:' entries have been changed to 'tags:'")

if __name__ == "__main__":
    print("Starting categories to tags conversion...")
    print("This will change 'categories:' to 'tags:' in all markdown files.")
    print()
    
    response = input("Continue? (y/N): ")
    if response.lower() in ['y', 'yes']:
        main()
    else:
        print("Update cancelled.")
