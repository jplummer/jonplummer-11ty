#!/usr/bin/env python3
"""
DRY RUN version of the post restructuring script.
This shows what would happen without making actual changes.

Usage: python3 restructure_posts_dry_run.py
"""

import os
import re
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

def dry_run_restructure():
    """Show what restructuring would do without making changes."""
    posts_dir = Path("_posts")
    
    if not posts_dir.exists():
        print("Error: _posts directory not found!")
        return
    
    changes_needed = []
    errors = []
    already_correct = []
    
    print("DRY RUN - No actual changes will be made!")
    print("=" * 60)
    
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
                    
                    # Check if restructuring is needed
                    current_path = post_dir
                    target_day_dir = month_dir / day_str
                    target_post_dir = target_day_dir / post_dir.name
                    
                    if current_path.parent.name != day_str:
                        # Restructuring needed
                        changes_needed.append({
                            'from': str(current_path),
                            'to': str(target_post_dir),
                            'date': date_str,
                            'post_name': post_dir.name
                        })
                        
                        print(f"    Would move: {post_dir.name} → {day_str}/{post_dir.name}")
                    else:
                        # Already correct
                        already_correct.append(str(current_path))
                        print(f"    Already correct: {post_dir.name}")
                        
                except Exception as e:
                    error_msg = f"Error processing {post_dir}: {e}"
                    print(f"    {error_msg}")
                    errors.append(error_msg)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"DRY RUN SUMMARY")
    print(f"{'='*60}")
    print(f"Changes needed: {len(changes_needed)}")
    print(f"Already correct: {len(already_correct)}")
    print(f"Errors: {len(errors)}")
    
    if changes_needed:
        print(f"\nPosts that would be restructured:")
        for change in changes_needed:
            print(f"  {change['from']} → {change['to']} (date: {change['date']})")
    
    if already_correct:
        print(f"\nPosts already in correct structure:")
        for post in already_correct[:10]:  # Show first 10
            print(f"  {post}")
        if len(already_correct) > 10:
            print(f"  ... and {len(already_correct) - 10} more")
    
    if errors:
        print(f"\nErrors encountered:")
        for error in errors:
            print(f"  {error}")
    
    print(f"\nTo actually make these changes, run:")
    print(f"  python3 restructure_posts.py")

if __name__ == "__main__":
    print("Starting DRY RUN of post restructuring...")
    print("This will show what would happen without making actual changes.")
    print()
    
    dry_run_restructure()
