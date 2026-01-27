#!/bin/bash

echo "🚀 Starting Notes App Android Build Process..."

# 1. Build Web Assets for Notes
echo "📦 Building Notes Web App (Vite)..."
npm run build:notes

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Web Build Failed!"
    exit 1
fi

# 2. Sync with Android Notes
# 2. Force Copy Assets (Bypassing potential sync issues)
echo "🧹 Cleaning old assets in android-notes..."
rm -rf android-notes/app/src/main/assets/public/*

echo "📂 Copying new assets to android-notes..."
mkdir -p android-notes/app/src/main/assets/public/
cp -R dist-notes/* android-notes/app/src/main/assets/public/

echo "🔄 Syncing with Capacitor (Config Update)..."
CAPACITOR_CONFIG_FILE=capacitor.config.notes.ts npx cap sync android

# 3. Clean and Build APK
echo "🏗️  Compiling Notes Android APK (Gradle)..."
cd android-notes
./gradlew clean assembleDebug
cd ..

# 4. Copy to Desktop with Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M)
TARGET_PATH="$HOME/Desktop/Molahazati_Notes_${TIMESTAMP}.apk"

echo "📂 Copying APK to Desktop..."
cp android-notes/app/build/outputs/apk/debug/app-debug.apk "$TARGET_PATH"

echo "✅ DONE! New Notes APK is on your Desktop:"
echo "$TARGET_PATH"
