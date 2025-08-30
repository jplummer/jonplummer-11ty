#!/usr/bin/env python3
"""
Script to restructure _posts folder to add day subfolders.
Changes from: _posts/YYYY/MM/post-slug/index.md
To: _posts/YYYY/MM/DD/post-slug/index.md

Usage: python3 restructure_posts.py
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime

def extract_date_from_post(post_path):
    """Extract date from post front matter."""
    try:
        with open(post_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Look for date in front matter
        date_match = re.search(r'date:\s*(\d{4}-\d{2}-\d{2})', content)
        if date_match:
            return date_match.group(1)
        
        # Alternative date formats
        date_match = re.search(r'date:\s*(\d{4}/\d{2}/\d{2})', content)
        if date_match:
            date_str = date_match.group(1)
            return date_str.replace('/', '-')
            
    except Exception as e:
        print(f"Error reading {post_path}: {e}")
    
    return None

def restructure_posts():
    """Restructure the _posts folder to add day subfolders."""
    posts_dir = Path("_posts")
    
    if not posts_dir.exists():
        print("Error: _posts directory not found!")
        return
    
    changes_made = []
    errors = []
    
    # Walk through all year/month/post directories
    for year_dir in posts_dir.iterdir():
        if not year_dir.is_dir() or year_dir.name.startswith('.'):
            continue
            
        if not year_dir.name.isdigit() or len(year_dir.name) != 4:
            continue
            
        print(f"Processing year: {year_dir.name}")
        
        for month_dir in year_dir.iterdir():
            if not month_dir.is_dir() or month_dir.name.startswith('.'):
                continue
                
            if not month_dir.name.isdigit() or len(month_dir.name) != 2:
                continue
                
            print(f"  Processing month: {month_dir.name}")
            
            for post_dir in month_dir.iterdir():
                if not post_dir.is_dir() or post_dir.name.startswith('.'):
                    continue
                    
                # Look for index.md in the post directory
                index_file = post_dir / "index.md"
                if not index_file.exists():
                    continue
                    
                # Extract date from post
                date_str = extract_date_from_post(index_file)
                if not date_str:
                    print(f"    Warning: Could not extract date from {index_file}")
                    continue
                    
                try:
                    # Parse the date
                    post_date = datetime.strptime(date_str, "%Y-%m-%d")
                    day_str = f"{post_date.day:02d}"
                    
                    # Check if we need to restructure
                    current_path = post_dir
                    target_day_dir = month_dir / day_str
                    target_post_dir = target_day_dir / post_dir.name
                    
                    if current_path.parent.name != day_str:
                        # Create day directory if it doesn't exist
                        target_day_dir.mkdir(exist_ok=True)
                        
                        # Move the post directory to the day directory
                        if target_post_dir.exists():
                            print(f"    Warning: Target already exists: {target_post_dir}")
                            continue
                            
                        shutil.move(str(current_path), str(target_post_dir))
                        
                        changes_made.append({
                            'from': str(current_path),
                            'to': str(target_post_dir),
                            'date': date_str
                        })
                        
                        print(f"    Moved: {post_dir.name} → {day_str}/{post_dir.name}")
                    else:
                        print(f"    Already correct: {post_dir.name}")
                        
                except Exception as e:
                    error_msg = f"Error processing {post_dir}: {e}"
                    print(f"    {error_msg}")
                    errors.append(error_msg)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Restructuring complete!")
    print(f"Changes made: {len(changes_made)}")
    print(f"Errors: {len(errors)}")
    
    if changes_made:
        print(f"\nChanges made:")
        for change in changes_made:
            print(f"  {change['from']} → {change['to']} (date: {change['date']})")
    
    if errors:
        print(f"\nErrors encountered:")
        for error in errors:
            print(f"  {error}")
    
    print(f"\nNext steps:")
    print(f"1. Review the changes above")
    print(f"2. Test your 11ty build: npm run build")
    print(f"3. Check that URLs work with new structure: /YYYY/MM/DD/post-slug/")
    print(f"4. Update your 11ty permalink configuration if needed")

if __name__ == "__main__":
    print("Starting post restructuring...")
    print("This will add day subfolders to your _posts directory.")
    print("Make sure you have a backup or Git commit before proceeding!")
    print()
    
    response = input("Continue? (y/N): ")
    if response.lower() in ['y', 'yes']:
        restructure_posts()
    else:
        print("Restructuring cancelled.")
