// pytorch-core-patch-simple.js
const fs = require('fs');
const path = require('path');

// Ruta al archivo JSIModulePackage que causa problemas
const jsiModulePackagePath = path.join(
  __dirname,
  'node_modules/react-native-pytorch-core/android/src/main/java/org/pytorch/rn/core/jsi/PyTorchCoreJSIModulePackage.java'
);

// Contenido actualizado del JSIModulePackage
const updatedJSIPackageContent = `
package org.pytorch.rn.core.jsi;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Esta clase ha sido parchada para compatibilidad con React Native 0.76+
public class PyTorchCoreJSIModulePackage extends TurboReactPackage {
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, com.facebook.react.module.model.ReactModuleInfo> moduleInfos = new HashMap<>();
      // No se requieren módulos JSI aquí
      return moduleInfos;
    };
  }
}
`;

// Ruta al archivo build.gradle de pytorch
const buildGradlePath = path.join(
  __dirname,
  'node_modules/react-native-pytorch-core/android/build.gradle'
);

// Contenido actualizado del build.gradle
const updatedBuildGradleContent = `
// Archivo parcheado para compatibilidad con React Native 0.76+
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

android {
    namespace "org.pytorch.rn.core"
    compileSdkVersion rootProject.ext.has('compileSdkVersion') ? rootProject.ext.get('compileSdkVersion') : 34
    ndkVersion rootProject.ext.has('ndkVersion') ? rootProject.ext.get('ndkVersion') : '26.1.10909125'
    
    defaultConfig {
        minSdkVersion rootProject.ext.has('minSdkVersion') ? rootProject.ext.get('minSdkVersion') : 24
        targetSdkVersion rootProject.ext.has('targetSdkVersion') ? rootProject.ext.get('targetSdkVersion') : 34
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = '11'
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.0"
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core-ktx:1.12.0'
}
`;

try {
  if (fs.existsSync(jsiModulePackagePath)) {
    fs.writeFileSync(jsiModulePackagePath, updatedJSIPackageContent);
    console.log('✅ PyTorchCoreJSIModulePackage.java ha sido actualizado correctamente');
  } else {
    console.error('❌ No se pudo encontrar el archivo JSIModulePackage.java');
  }

  if (fs.existsSync(buildGradlePath)) {
    fs.writeFileSync(buildGradlePath, updatedBuildGradleContent);
    console.log('✅ build.gradle de PyTorch ha sido actualizado correctamente');
  } else {
    console.error('❌ No se pudo encontrar el archivo build.gradle de PyTorch');
  }

  console.log('🚀 Parche completado. Intenta compilar de nuevo tu aplicación.');
} catch (error) {
  console.error('❌ Error al aplicar el parche:', error);
}