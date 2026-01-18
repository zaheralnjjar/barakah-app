#!/bin/bash

echo "🚀 Starting Full Android Build Process..."

# 1. Build Web Assets
echo "📦 Building Web App (Vite)..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Web Build Failed!"
    exit 1
fi

# 2. Sync with Android
echo "🔄 Syncing with Capacitor Android..."
npx cap sync android

# 3. Clean and Build APK
echo "🏗️  Compiling Android APK (Gradle)..."
cd android
./gradlew clean assembleDebug
cd ..

# 4. Copy to Desktop with Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M)
TARGET_PATH="$HOME/Desktop/Barakah_App_v2_${TIMESTAMP}.apk"

echo "📂 Copying APK to Desktop..."
cp android/app/build/outputs/apk/debug/app-debug.apk "$TARGET_PATH"

echo "✅ DONE! New APK is on your Desktop:"
echo "$TARGET_PATH"
