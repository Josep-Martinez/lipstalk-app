const fs = require('fs');
const path = require('path');

// Ruta al directorio de PyTorch
const pytorchDir = path.join(__dirname, 'node_modules/react-native-pytorch-core/android');
const buildGradlePath = path.join(pytorchDir, 'build.gradle');

// Verificar que existan los archivos
if (!fs.existsSync(buildGradlePath)) {
  console.error('❌ No se pudo encontrar el archivo build.gradle de PyTorch');
  process.exit(1);
}

// Contenido actualizado para build.gradle
const updatedBuildGradle = `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

apply plugin: 'com.android.library'

android {
    namespace "org.pytorch.rn.core"
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 34
        
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

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.facebook.react:react-android'
    implementation 'androidx.core:core-ktx:1.12.0'
    
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

// Escribir el nuevo build.gradle
try {
  fs.writeFileSync(buildGradlePath, updatedBuildGradle);
  console.log('✅ build.gradle de PyTorch actualizado con éxito');
} catch (error) {
  console.error('❌ Error al actualizar build.gradle:', error);
}

// Modificar el archivo JSIModulePackage
const jsiPath = path.join(pytorchDir, 'src/main/java/org/pytorch/rn/core/jsi/PyTorchCoreJSIModulePackage.java');
if (fs.existsSync(jsiPath)) {
  const updatedJSI = `
package org.pytorch.rn.core.jsi;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
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
  try {
    fs.writeFileSync(jsiPath, updatedJSI);
    console.log('✅ PyTorchCoreJSIModulePackage.java actualizado con éxito');
  } catch (error) {
    console.error('❌ Error al actualizar JSIModulePackage:', error);
  }
}

// Modificar el archivo gradle.properties
const gradlePropertiesPath = path.join(__dirname, 'android/gradle.properties');
if (fs.existsSync(gradlePropertiesPath)) {
  let gradleProps = fs.readFileSync(gradlePropertiesPath, 'utf8');
  
  // Cambiar newArchEnabled a false si está en true
  if (gradleProps.includes('newArchEnabled=true')) {
    gradleProps = gradleProps.replace('newArchEnabled=true', 'newArchEnabled=false');
    
    try {
      fs.writeFileSync(gradlePropertiesPath, gradleProps);
      console.log('✅ gradle.properties actualizado (newArchEnabled=false)');
    } catch (error) {
      console.error('❌ Error al actualizar gradle.properties:', error);
    }
  } else {
    console.log('ℹ️ newArchEnabled ya está configurado como false o no está presente');
  }
}

// Añadir PyTorch a settings.gradle si no está ya
const settingsGradlePath = path.join(__dirname, 'android/settings.gradle');
if (fs.existsSync(settingsGradlePath)) {
  let settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');
  
  // Solo añadir si no existe ya
  if (!settingsGradle.includes(':react-native-pytorch-core')) {
    const addition = `
// PyTorch Core
include ':react-native-pytorch-core'
project(':react-native-pytorch-core').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-pytorch-core/android')
`;
    
    // Buscar un buen lugar para añadir estas líneas (después de include ':app')
    settingsGradle = settingsGradle.replace('include \':app\'', 'include \':app\'' + addition);
    
    try {
      fs.writeFileSync(settingsGradlePath, settingsGradle);
      console.log('✅ settings.gradle actualizado para incluir PyTorch');
    } catch (error) {
      console.error('❌ Error al actualizar settings.gradle:', error);
    }
  } else {
    console.log('ℹ️ PyTorch ya está incluido en settings.gradle');
  }
}

console.log('🚀 Proceso de modificación completado. Intenta compilar de nuevo.');
console.log('Comando recomendado: cd android && ./gradlew clean && cd .. && npx expo run:android');