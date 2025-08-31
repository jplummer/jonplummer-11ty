#!/usr/bin/env python3
"""
Script to add 'tags: post' to all markdown files that don't already have 'tags: portfolio'.
This ensures every post has appropriate tagging.

Usage: python3 add_post_tags.py
"""

import os
import re
from pathlib import Path

def add_post_tag(file_path):
    """Add 'tags: post' to a markdown file if it doesn't have portfolio tags."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file already has portfolio tags
        if re.search(r'^tags:\s*portfolio', content, re.MULTILINE):
            return False, "Already has portfolio tags"
        
        # Check if file already has any tags
        if re.search(r'^tags:', content, re.MULTILINE):
            return False, "Already has other tags"
        
        # Find the end of front matter (after the second ---)
        front_matter_end = content.find('---', 3)
        if front_matter_end == -1:
            return False, "No front matter found"
        
        # Insert tags: post before the closing ---
        new_content = content[:front_matter_end] + 'tags: post\n' + content[front_matter_end:]
        
        # Write the updated content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, "Added tags: post"
        
    except Exception as e:
        return False, f"Error: {e}"

def main():
    """Main function to add post tags to all markdown files."""
    posts_dir = Path("_posts")
    
    if not posts_dir.exists():
        print("Error: _posts directory not found!")
        return
    
    updated_files = []
    skipped_files = []
    total_files = 0
    
    print("Searching for markdown files that need 'tags: post'...")
    
    # Walk through all markdown files
    for md_file in posts_dir.rglob("*.md"):
        total_files += 1
        success, message = add_post_tag(md_file)
        
        if success:
            updated_files.append(str(md_file))
            print(f"Updated: {md_file}")
        else:
            skipped_files.append((str(md_file), message))
            print(f"Skipped: {md_file} - {message}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Tag addition complete!")
    print(f"Files processed: {total_files}")
    print(f"Files updated: {len(updated_files)}")
    print(f"Files skipped: {len(skipped_files)}")
    
    if updated_files:
        print(f"\nFiles that got 'tags: post':")
        for file_path in updated_files:
            print(f"  {file_path}")
    
    if skipped_files:
        print(f"\nFiles that were skipped:")
        for file_path, reason in skipped_files:
            print(f"  {file_path} - {reason}")
    
    print(f"\nAll posts now have appropriate tagging!")

if __name__ == "__main__":
    print("Starting post tag addition...")
    print("This will add 'tags: post' to posts that don't have portfolio tags.")
    print()
    
    response = input("Continue? (y/N): ")
    if response.lower() in ['y', 'yes']:
        main()
    else:
        print("Tag addition cancelled.")
