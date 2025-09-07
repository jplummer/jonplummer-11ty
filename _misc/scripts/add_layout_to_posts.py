#!/usr/bin/env python3
"""
Script to add 'layout: single_post.njk' to all markdown files with 'tags: post'.
This will add the layout to the frontmatter of each post file.
"""

import os
import re
from pathlib import Path

def add_layout_to_post(file_path):
    """Add layout: single_post.njk to a post file's frontmatter."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file already has layout defined
        if 'layout:' in content:
            print(f"  Skipping {file_path} - already has layout defined")
            return False
        
        # Find the end of frontmatter (---)
        frontmatter_end = content.find('---', 3)  # Start after first ---
        if frontmatter_end == -1:
            print(f"  Skipping {file_path} - no frontmatter found")
            return False
        
        # Insert layout after the first line (title)
        lines = content.split('\n')
        insert_index = 1  # After the first ---
        
        # Find a good place to insert (after title, before tags)
        for i, line in enumerate(lines[1:], 1):
            if line.strip() == '---':
                break
            if line.strip().startswith('title:'):
                insert_index = i + 1
                break
        
        # Insert the layout line
        lines.insert(insert_index, 'layout: single_post.njk')
        
        # Write back to file
        new_content = '\n'.join(lines)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  Updated {file_path}")
        return True
        
    except Exception as e:
        print(f"  Error processing {file_path}: {e}")
        return False

def main():
    """Process all post files."""
    posts_dir = Path("_posts")
    updated_count = 0
    total_count = 0
    
    print("Adding 'layout: single_post.njk' to all post files...")
    
    # Find all markdown files in _posts directory
    for md_file in posts_dir.rglob("*.md"):
        total_count += 1
        print(f"Processing {md_file}")
        
        if add_layout_to_post(md_file):
            updated_count += 1
    
    print(f"\nCompleted! Updated {updated_count} out of {total_count} files.")

if __name__ == "__main__":
    main()
