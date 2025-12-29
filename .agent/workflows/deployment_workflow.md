---
description: Build and archive mobile and desktop apps
---

This workflow builds the Android and Electron applications, pushes changes to Git, and archives the binaries to the Desktop.

1. **Git Operations**
   Ensure all changes are tracked.
   ```bash
   git add .
   git commit -m "Auto-release: $(date +'%Y-%m-%d %H:%M')" || echo "No changes to commit"
   git push origin main || echo "Push failed or branch not set"
   ```

2. **Build Android (Mobile)**
   Build the debug APK.
   ```bash
   cd android
   ./gradlew assembleDebug
   cd ..
   ```

3. **Build Electron (Desktop)**
   Build the desktop application.
   ```bash
   npm run electron:build
   ```

4. **Archive artifacts**
   Create a versioned folder on the desktop and copy the builds.
   ```bash
   # Extract version from package.json
   VERSION=$(node -p "require('./package.json').version")
   TARGET_DIR="/Users/zaher/Desktop/111/v$VERSION"
   
   echo "Archiving to $TARGET_DIR..."
   mkdir -p "$TARGET_DIR"
   
   # Copy Android APK
   cp android/app/build/outputs/apk/debug/app-debug.apk "$TARGET_DIR/Barakah_Mobile_v$VERSION.apk"
   
   # Copy Desktop Build (assuming DMG for Mac, adjust if needed)
   # release/ directory contains the output from electron-builder
   cp release/*.dmg "$TARGET_DIR/Barakah_Desktop_v$VERSION.dmg" || echo "No DMG found to copy"
   
   echo "Archive complete."
   ls -F "$TARGET_DIR"
   ```
