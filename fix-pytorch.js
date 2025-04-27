const fs = require('fs');
const path = require('path');

// Ruta al build.gradle de PyTorch
const pytorchBuildGradlePath = path.join(
  __dirname,
  'node_modules/react-native-pytorch-core/android/build.gradle'
);

// Contenido actualizado del build.gradle
const updatedBuildGradleContent = `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    namespace "org.pytorch.rn.core"
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles "consumer-rules.pro"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.facebook.react:react-android'
    
    // CameraX
    implementation "androidx.camera:camera-core:1.3.0"
    implementation "androidx.camera:camera-camera2:1.3.0"
    implementation "androidx.camera:camera-lifecycle:1.3.0"
    implementation "androidx.camera:camera-view:1.3.0"
    implementation "androidx.camera:camera-extensions:1.3.0"
    
    // ConstraintLayout
    implementation "androidx.constraintlayout:constraintlayout:2.1.4"
    
    // Google Common (para ListenableFuture)
    implementation "com.google.guava:guava:32.0.1-android"
    
    // PyTorch
    implementation "org.pytorch:pytorch_android:1.13.1"
    implementation "org.pytorch:pytorch_android_torchvision:1.13.1"
}
`;

// Escribir el nuevo build.gradle para PyTorch
fs.writeFileSync(pytorchBuildGradlePath, updatedBuildGradleContent);
console.log('✅ PyTorch build.gradle actualizado con éxito');

// También arreglar el JSIModulePackage
const jsiModulePackagePath = path.join(
  __dirname,
  'node_modules/react-native-pytorch-core/android/src/main/java/org/pytorch/rn/core/jsi/PyTorchCoreJSIModulePackage.java'
);

if (fs.existsSync(jsiModulePackagePath)) {
  const updatedJSIPackageContent = `
package org.pytorch.rn.core.jsi;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

public class PyTorchCoreJSIModulePackage extends TurboReactPackage {
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, com.facebook.react.module.model.ReactModuleInfo> moduleInfos = new HashMap<>();
      return moduleInfos;
    };
  }
}
`;
  
  fs.writeFileSync(jsiModulePackagePath, updatedJSIPackageContent);
  console.log('✅ PyTorchCoreJSIModulePackage.java actualizado con éxito');
}