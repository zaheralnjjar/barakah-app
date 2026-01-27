#!/bin/bash

# Configuration
VERSION="v2.14.0"
OUTPUT_DIR="/Users/zaher/Desktop/111/$VERSION"
PROJECT_DIR="/Users/zaher/Baraka2/barakah_life_management"

echo "🚀 Starting Deployment Process for $VERSION..."

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# 1. Build Web App
echo "📦 Building Web App..."
cd "$PROJECT_DIR" || exit
npm run build

# 2. Sync Capacitor
echo "🔄 Syncing Capacitor Android..."
npx cap sync android

# 3. Build Android APK
echo "🤖 Building Android APK..."
cd android || exit
./gradlew assembleDebug

# 4. Copy APK to Output
APK_SOURCE="$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="$OUTPUT_DIR/app-debug.apk"

if [ -f "$APK_SOURCE" ]; then
    cp "$APK_SOURCE" "$APK_DEST"
    echo "✅ APK copied to: $APK_DEST"
else
    echo "❌ APK build failed or file not found!"
    exit 1
fi

# 5. Connect and Install to Device (Optional but recommended)
echo "📱 Attempting to install on connected device..."
adb install -r "$APK_DEST"

echo "🎉 Deployment Process Complete!"
