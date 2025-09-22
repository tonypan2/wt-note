# Publishing to VS Code Marketplace

## Prerequisites
✅ Extension packaged: `git-note-statusbar-1.0.0.vsix`
✅ LICENSE file added
✅ Required package.json fields configured

## Next Steps

### 1. Update package.json
Before publishing, update these fields with your actual information:
- `"publisher": "your-publisher-name"` - Your publisher ID (create one at marketplace)
- `"repository.url": "https://github.com/yourusername/git-note-statusbar"` - Your actual repo URL

### 2. Create Publisher Account
1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with Microsoft account
3. Create a new publisher ID (this will be your `publisher` field)

### 3. Get Personal Access Token
1. Go to https://dev.azure.com/your-organization
2. Click User Settings → Personal Access Tokens
3. Create new token with:
   - Organization: All accessible organizations
   - Scopes: Marketplace → Manage

### 4. Publish Extension

#### Option A: Command Line
```bash
# Login with your token
vsce login your-publisher-name

# Publish to marketplace
vsce publish

# Or publish the pre-built package
vsce publish --packagePath git-note-statusbar-1.0.0.vsix
```

#### Option B: Web Upload
1. Go to https://marketplace.visualstudio.com/manage
2. Click "New Extension" → "Visual Studio Code"
3. Upload the `git-note-statusbar-1.0.0.vsix` file
4. Fill in additional details

### 5. Test Installation
Once published, users can install via:
- Command Palette: `ext install your-publisher-name.git-note-statusbar`
- Or search "Git Note Status Bar" in Extensions view

## Version Updates
To publish updates:
```bash
# Bump version
npm version patch/minor/major

# Rebuild and publish
vsce publish
```

## Optional: Add Icon
Consider adding a 128x128 PNG icon:
1. Create `icon.png` in root directory
2. Add `"icon": "icon.png"` to package.json
3. Repackage with `vsce package`