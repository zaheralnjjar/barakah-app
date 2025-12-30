plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.barakah.watch"
    compileSdk = 33

    defaultConfig {
        applicationId = "com.barakah.watch"
        minSdk = 30
        targetSdk = 33
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.4.8"
    }
}

dependencies {
    // Wear OS Compose - Stable versions
    implementation("androidx.wear.compose:compose-material:1.1.2")
    implementation("androidx.wear.compose:compose-foundation:1.1.2")
    implementation("androidx.wear.compose:compose-navigation:1.1.2")
    
    // Tiles
    implementation("androidx.wear.tiles:tiles:1.2.0-alpha05")
    implementation("androidx.wear.tiles:tiles-material:1.2.0-alpha05")
    
    // Core
    implementation("androidx.core:core-ktx:1.10.1")
    implementation("androidx.activity:activity-compose:1.7.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.1")
    
    // Compose
    implementation("androidx.compose.ui:ui:1.4.3")
    implementation("androidx.compose.ui:ui-tooling-preview:1.4.3")
    implementation("androidx.compose.material:material-icons-extended:1.4.3")
    
    // Data Layer API
    implementation("com.google.android.gms:play-services-wearable:18.0.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.7.1")
    
    // Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.30.1")
    
    // JSON
    implementation("com.google.code.gson:gson:2.10.1")
    
    debugImplementation("androidx.compose.ui:ui-tooling:1.4.3")
}
