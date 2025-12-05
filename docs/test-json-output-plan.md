# Test JSON Output Refactoring Plan

## Overview

Refactor all test scripts to output structured JSON instead of formatted console output. A centralized formatter will consume JSON and produce human-readable output. This separates data collection from presentation, making it easier to adjust display formats and add new output types.

## Goals

1. **Separation of concerns**: Tests collect data, formatter displays it
2. **Centralized formatting**: Change display logic in one place
3. **Flexibility**: Support multiple output formats (compact, verbose, table, HTML, etc.)
4. **Maintainability**: Easier to adjust output without editing each test file
5. **Programmatic access**: Structured data for CI/CD, dashboards, automation

## Current State Analysis

### What Tests Currently Do

1. **Collect data** during validation
2. **Format and output** directly via `console.log()` (~189 calls across tests)
3. **Write minimal JSON summary** (`.{testType}-summary.json`) with just counts
4. **Use shared utilities** (`printSummary()`, `exitWithResults()`) for some formatting

### Output Patterns Found

- **File-level issues**: Issues grouped by file with relative paths
- **Line/column locations**: For markdown, HTML validation errors
- **Issue types**: Categorized by severity (error, warning) and type
- **Aggregated metrics**: Counts of files, issues, warnings
- **Custom sections**: Accessibility has light/dark mode breakdowns
- **Grouped issues**: Duplicate titles, duplicate slugs, etc.
- **Context information**: Line context, file paths, rule IDs

## Proposed JSON Schema

### Core Structure

```json
{
  "testType": "html",
  "testName": "HTML Validation",
  "timestamp": "2025-01-20T10:30:00Z",
  "summary": {
    "files": 150,
    "filesWithIssues": 5,
    "filesWithWarnings": 2,
    "issues": 12,
    "warnings": 3,
    "passed": 143
  },
  "files": [
    {
      "path": "about/index.html",
      "relativePath": "about/index.html",
      "status": "failed",
      "issues": [
        {
          "severity": "error",
          "type": "invalid-html",
          "message": "Element 'div' not allowed as child of element 'span'",
          "ruleId": "element-permitted-content",
          "line": 42,
          "column": 15,
          "context": "<span><div>...</div></span>"
        }
      ],
      "warnings": []
    }
  ],
  "globalIssues": [
    {
      "severity": "error",
      "type": "duplicate-titles",
      "message": "Duplicate title 'About' found in multiple files",
      "files": ["about/index.html", "about-us/index.html"]
    }
  ],
  "customSections": {
    "light-mode": {
      "violations": 5,
      "filesWithViolations": 3
    }
  },
  "metadata": {
    "testVersion": "1.0.0",
    "duration": 1234
  }
}
```

### Issue Object Schema

```typescript
{
  severity: "error" | "warning" | "info",
  type: string,              // e.g., "missing-title", "invalid-html", "broken-link"
  message: string,           // Human-readable message
  ruleId?: string,           // For linting tools (e.g., "MD022", "element-permitted-content")
  line?: number,
  column?: number,
  context?: string,          // Line or code snippet
  file?: string,             // For issues not tied to specific file
  helpUrl?: string,          // Link to documentation
  impact?: string,           // For accessibility (e.g., "critical", "moderate")
  nodes?: string[],          // For accessibility violations
  tags?: string[]            // For accessibility (e.g., ["wcag2a", "color-contrast"])
}
```

### File Object Schema

```typescript
{
  path: string,              // Absolute path
  relativePath: string,      // Relative to site root or source
  status: "passed" | "failed" | "warning",
  issues: Issue[],
  warnings: Issue[],
  skipped?: boolean,
  skipReason?: string
}
```

## Implementation Plan

### Phase 1: Design & Infrastructure (Foundation)

1. **Create JSON schema definition**
   - Document full schema in `docs/test-json-schema.md`
   - Create JSDoc types for IDE support
   - Add schema validation utility (optional, for debugging)

2. **Create result builder utility**
   - New file: `scripts/utils/test-result-builder.js`
   - Helper functions to build JSON structures:
     - `createTestResult(testType, testName)` - Initialize result object
     - `addFile(result, filePath, relativePath)` - Add file to result
     - `addIssue(fileObj, issue)` - Add issue to file
     - `addWarning(fileObj, warning)` - Add warning to file
     - `addGlobalIssue(result, issue)` - Add global issue (e.g., duplicates)
     - `addCustomSection(result, sectionName, data)` - Add custom section
     - `finalizeTestResult(result)` - Calculate summary, set status
     - `outputResult(result)` - Output JSON with markers
   - Handles summary calculation automatically

3. **Create formatter module**
   - New file: `scripts/utils/test-formatter.js`
   - Functions:
     - `formatCompact(result)` - Single line per test (matches current compact mode)
     - `formatVerbose(result)` - Full detailed output (matches current verbose mode)
     - `formatTable(result)` - Tabular format (future enhancement)
     - `formatJson(result)` - Pretty-printed JSON (for debugging)
   - Support for:
     - Issue grouping and sorting
     - Color coding (if terminal supports, via `chalk` or similar)
     - Custom sections (accessibility light/dark mode, etc.)
     - Emoji and formatting matching current output

4. **Update test runner**
   - Modify `test-runner.js`:
     - Change stdout capture: `stdio: ['inherit', 'pipe', 'inherit']`
     - Extract JSON from stdout (using markers or auto-detect)
     - Parse JSON and pass to formatter
     - Handle both old (console.log) and new (JSON) formats
     - Preserve exit codes and error handling
   - Add `--format` flag: `compact` (default), `verbose`, `table`, `json`
   - Update spinner logic to work with JSON output

### Phase 2: Migrate Tests (Incremental)

Migrate one test at a time, starting with simplest:

1. **rss-feed.js** (simplest - single file type, basic issues)
2. **og-images.js** (simple - file-level validation)
3. **internal-links.js** (moderate - link checking)
4. **html.js** (moderate - uses html-validate)
5. **markdown.js** (moderate - uses markdownlint + custom checks)
6. **content-structure.js** (complex - front matter, duplicates)
7. **seo-meta.js** (complex - multiple validations, issue types)
8. **accessibility.js** (most complex - puppeteer, multiple modes, custom sections)

**Migration pattern for each test:**

1. Replace `console.log()` calls with result builder calls
2. Collect all data into JSON structure
3. Output JSON to stdout (or file if needed)
4. Update test runner to format JSON for that test
5. Test both individual and grouped runs
6. Verify output matches current behavior

### Phase 3: Enhanced Features

1. **Multiple output formats**
   - Add `--format table` for tabular view
   - Add `--format html` for HTML reports
   - Add `--format json` for raw JSON (useful for automation)

2. **Filtering and sorting**
   - `--filter severity=error`
   - `--filter type=missing-title`
   - `--sort file` or `--sort severity`

3. **Progress indicators**
   - Show progress during long-running tests
   - Use JSON stream for real-time updates

4. **CI/CD integration**
   - JUnit XML output
   - GitHub Actions annotations
   - GitLab CI integration

## Detailed Migration Steps

### Step 1: Create Result Builder Utility

**File**: `scripts/utils/test-result-builder.js`

```javascript
function createTestResult(testType, testName) {
  return {
    testType,
    testName,
    timestamp: new Date().toISOString(),
    summary: {
      files: 0,
      filesWithIssues: 0,
      filesWithWarnings: 0,
      issues: 0,
      warnings: 0,
      passed: 0
    },
    files: [],
    globalIssues: [],
    customSections: {},
    metadata: {}
  };
}

function addFile(result, filePath, relativePath) {
  const fileObj = {
    path: filePath,
    relativePath,
    status: 'passed',
    issues: [],
    warnings: []
  };
  result.files.push(fileObj);
  result.summary.files++;
  return fileObj;
}

function addIssue(fileObj, issue) {
  if (!fileObj.issues) fileObj.issues = [];
  fileObj.issues.push(issue);
  fileObj.status = 'failed';
  // Summary updated in finalizeTestResult()
}

function addWarning(fileObj, warning) {
  if (!fileObj.warnings) fileObj.warnings = [];
  fileObj.warnings.push(warning);
  if (fileObj.status === 'passed') {
    fileObj.status = 'warning';
  }
}

function addGlobalIssue(result, issue) {
  if (!result.globalIssues) result.globalIssues = [];
  result.globalIssues.push(issue);
}

function finalizeTestResult(result) {
  // Calculate summary from files
  let filesWithIssues = 0;
  let filesWithWarnings = 0;
  let totalIssues = 0;
  let totalWarnings = 0;
  let passed = 0;

  result.files.forEach(file => {
    const fileIssues = file.issues?.length || 0;
    const fileWarnings = file.warnings?.length || 0;
    
    if (fileIssues > 0) {
      filesWithIssues++;
      totalIssues += fileIssues;
    } else if (fileWarnings > 0) {
      filesWithWarnings++;
      totalWarnings += fileWarnings;
    } else {
      passed++;
    }
    
    totalWarnings += fileWarnings;
  });

  // Add global issues
  totalIssues += result.globalIssues?.length || 0;

  result.summary = {
    files: result.files.length,
    filesWithIssues,
    filesWithWarnings,
    issues: totalIssues,
    warnings: totalWarnings,
    passed
  };

  return result;
}

function outputResult(result) {
  finalizeTestResult(result);
  console.log('__TEST_JSON_START__');
  console.log(JSON.stringify(result, null, 2));
  console.log('__TEST_JSON_END__');
}

module.exports = {
  createTestResult,
  addFile,
  addIssue,
  addWarning,
  addGlobalIssue,
  finalizeTestResult,
  outputResult
};
```

### Step 2: Create Formatter

**File**: `scripts/utils/test-formatter.js`

```javascript
const { getTestEmoji, getTestDisplayName } = require('./reporting-utils');

function formatCompact(result) {
  // Match current compact format from test-runner.js
  const emoji = getTestEmoji(result.testType);
  const displayName = getTestDisplayName(result.testType);
  const summary = result.summary;
  
  const resultIcon = summary.issues > 0 ? '❌' : '✅';
  const files = summary.files;
  const passing = summary.passed;
  const issues = summary.issues;
  const warnings = summary.warnings;
  
  let summaryParts = [];
  if (files > 0) {
    const itemName = files === 1 ? 'file' : 'files';
    summaryParts.push(`📄 ${files} ${itemName} checked`);
  }
  summaryParts.push(`✅ ${passing} passing`);
  if (issues > 0) {
    summaryParts.push(`❌ ${issues} issue${issues === 1 ? '' : 's'}`);
  }
  if (warnings > 0) {
    summaryParts.push(`⚠️  ${warnings} warning${warnings === 1 ? '' : 's'}`);
  }
  
  return `${resultIcon} ${emoji} ${displayName}: ${summaryParts.join(', ')}`;
}

function formatVerbose(result) {
  // Full output matching current console.log format
  // Include all file details, issues, warnings, custom sections
  // This is the most complex function - needs to match current output exactly
}

function formatTable(result) {
  // Future: Tabular format
  // Could use a library like cli-table3 or manual formatting
}

function formatJson(result) {
  return JSON.stringify(result, null, 2);
}

module.exports = {
  formatCompact,
  formatVerbose,
  formatTable,
  formatJson
};
```

### Step 3: Update Test Runner

**Modifications to `test-runner.js`:**

1. **Output capture strategy**:
   - Change `stdio: 'inherit'` to `stdio: ['inherit', 'pipe', 'inherit']` (capture stdout, pass through stderr)
   - Tests output JSON to stdout at the end
   - Progress/status messages can go to stderr (or be suppressed in JSON mode)
   - Alternative: Use a special marker like `__TEST_JSON_START__` and `__TEST_JSON_END__` to extract JSON from mixed output

2. **JSON detection and parsing**:
   - Check if stdout contains valid JSON (starts with `{` and ends with `}`)
   - If JSON found: parse and format using formatter
   - If not JSON: treat as old format (pass through to console)
   - Handle JSON parse errors gracefully

3. **Format option**:
   - Add `--format` flag: `compact` (default), `verbose`, `table`, `json`
   - Pass format preference to formatter
   - For grouped runs, use format for all tests

4. **Error handling**:
   - If test exits with error code but outputs JSON, still format the JSON
   - If test crashes without JSON, show error message
   - Preserve exit codes (0 = pass, 1 = fail)

5. **Backward compatibility**:
   - Support both formats during migration
   - Auto-detect format (JSON vs console.log)
   - No breaking changes to existing behavior

### Step 4: Migrate First Test (rss-feed.js)

**Example transformation:**

**Before:**
```javascript
console.log(`📄 ${relativePath}:`);
console.log(`   ❌ Issues:`);
issues.forEach(issue => console.log(`      - ${issue}`));
```

**After:**
```javascript
const { createTestResult, addFile, addIssue, outputResult } = require('../utils/test-result-builder');

// At start of test
const result = createTestResult('rss-feed', 'RSS Feed Validation');

// During validation
const fileObj = addFile(result, file, relativePath);
issues.forEach(issue => {
  addIssue(fileObj, {
    severity: 'error',
    type: 'rss-structure',
    message: issue
  });
});

// At end of test
outputResult(result);
process.exit(result.summary.issues > 0 ? 1 : 0);
```

At end of test:
```javascript
// Finalize result (calculate summary, etc.)
finalizeTestResult(result);

// Output JSON to stdout
// Use a marker to help test runner identify JSON in mixed output
console.log('__TEST_JSON_START__');
console.log(JSON.stringify(result, null, 2));
console.log('__TEST_JSON_END__');
```

**Alternative approach** (cleaner but requires more changes):
- Tests write JSON to a file: `.{testType}-result.json`
- Test runner reads file after test completes
- Cleaner separation, but requires file I/O
- Recommended: Use stdout with markers for simplicity

## Backward Compatibility

During migration, support both formats:

1. **Detection**: 
   - Check for `__TEST_JSON_START__` marker in stdout
   - Or check if stdout contains valid JSON (starts with `{` and is parseable)
   - If markers found, extract JSON between markers
   - If no markers but valid JSON, parse entire stdout

2. **Fallback**: 
   - If not JSON, treat as old format (pass through to console)
   - Preserve all existing behavior for non-migrated tests

3. **Gradual migration**: 
   - Migrate tests one at a time
   - Each test can be migrated independently
   - Test runner handles both formats seamlessly

4. **No breaking changes**: 
   - Old format continues to work
   - Existing scripts/CI/CD continue to work
   - Only new format adds capabilities

## Testing Strategy

1. **Unit tests for formatter**
   - Test each format type (compact, verbose, table, json)
   - Test edge cases:
     - No issues (all passing)
     - Many issues (100+)
     - No files
     - Files with only warnings
     - Global issues only
     - Custom sections
     - Missing optional fields

2. **Unit tests for result builder**
   - Test each helper function
   - Test summary calculation
   - Test edge cases (empty results, etc.)

3. **Integration tests**
   - Run each migrated test individually
   - Run grouped tests (fast, all)
   - Compare output with current behavior (side-by-side)
   - Test with `--format` flag variations
   - Test backward compatibility (old format still works)

4. **Visual verification**
   - Side-by-side comparison of old vs new output
   - Ensure all information is preserved
   - Check formatting matches (emojis, spacing, etc.)
   - Verify exit codes are correct

5. **Error handling tests**
   - Test with malformed JSON
   - Test with test crashes
   - Test with missing markers
   - Test with parse errors

## Benefits After Migration

1. **Easier to adjust output**: Change formatter, not 10 test files
2. **New output formats**: Add HTML/table/JSON without touching tests
3. **Better for automation**: Structured data for CI/CD
4. **Consistent format**: All tests use same structure
5. **Easier debugging**: Can output raw JSON to inspect data

## Risks & Mitigation

1. **Risk**: Breaking existing workflows
   - **Mitigation**: Support both formats during migration, test thoroughly, auto-detect format

2. **Risk**: Performance impact (JSON parsing)
   - **Mitigation**: Minimal - JSON parsing is fast, tests are I/O bound. JSON output is smaller than formatted text.

3. **Risk**: More complex code
   - **Mitigation**: Better organized, easier to maintain long-term. Clear separation of concerns.

4. **Risk**: Migration takes time
   - **Mitigation**: Incremental approach, one test at a time. Can stop at any point.

5. **Risk**: Mixed output (progress + JSON)
   - **Mitigation**: Use markers (`__TEST_JSON_START__`/`__TEST_JSON_END__`) or write progress to stderr

6. **Risk**: Test crashes before JSON output
   - **Mitigation**: Test runner handles errors gracefully, shows error message if JSON not found

## Timeline Estimate

- **Phase 1** (Infrastructure): 2-3 hours
- **Phase 2** (Migration): 4-6 hours (1 test per 30-60 min)
- **Phase 3** (Enhancements): 2-3 hours
- **Total**: ~8-12 hours

## Success Criteria

1. All tests output JSON
2. Formatter produces output matching current behavior
3. All test functionality preserved
4. No breaking changes to test runner API
5. Easier to add new output formats
6. Documentation updated

## Edge Cases & Special Considerations

### Progress Indicators
- **Issue**: Long-running tests (accessibility) show progress via console.log
- **Solution**: 
  - Option 1: Write progress to stderr (not captured)
  - Option 2: Include progress in JSON as metadata
  - Option 3: Suppress progress in JSON mode, show only at end
  - **Recommendation**: Option 1 (stderr) - cleanest separation

### Error Handling
- **Test crashes before JSON output**: Test runner shows error message
- **Invalid JSON**: Test runner falls back to showing raw output
- **Missing markers**: Auto-detect JSON if markers not found
- **Partial JSON**: Handle gracefully, show what was captured

### File Paths
- **Absolute vs relative**: Store both in JSON for flexibility
- **Path normalization**: Handle Windows/Unix path differences
- **Special files**: Redirect pages, utility pages (og-image-preview)

### Custom Sections
- **Accessibility light/dark mode**: Store in `customSections`
- **Duplicate detection**: Store in `globalIssues` with `files` array
- **Issue type counts**: Calculate from issues, store in metadata

### Performance
- **Large result sets**: JSON should be efficient (no unnecessary data)
- **Memory usage**: Stream JSON for very large results (future enhancement)
- **Parse time**: Minimal - JSON parsing is fast

## Migration Checklist (Per Test)

- [ ] Replace `console.log()` with result builder calls
- [ ] Collect all data into JSON structure
- [ ] Handle edge cases (no files, all passing, etc.)
- [ ] Test individual run (`npm run test <type>`)
- [ ] Test grouped run (`npm run test fast` or `all`)
- [ ] Compare output side-by-side with current version
- [ ] Verify exit codes are correct
- [ ] Test with `--format` flag
- [ ] Update documentation if needed
- [ ] Remove old summary file writing (`.{type}-summary.json`)

## Next Steps

1. **Review and approve this plan**
   - Check if schema covers all use cases
   - Verify migration order makes sense
   - Confirm timeline is reasonable

2. **Start with Phase 1 (infrastructure)**
   - Create result builder utility
   - Create formatter (start with compact and verbose)
   - Update test runner to handle JSON
   - Test with mock JSON data

3. **Migrate first test (rss-feed.js) as proof of concept**
   - Simplest test to validate approach
   - Verify all functionality works
   - Get feedback on approach

4. **Iterate based on learnings**
   - Adjust schema if needed
   - Refine formatter output
   - Improve error handling

5. **Continue with remaining tests**
   - Follow migration checklist
   - One test at a time
   - Test thoroughly before moving to next

