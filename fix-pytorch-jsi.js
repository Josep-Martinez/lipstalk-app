const fs = require('fs');
const path = require('path');

// Ruta al archivo JSIModulePackage
const jsiPath = path.join(
  __dirname,
  'node_modules/react-native-pytorch-core/android/src/main/java/org/pytorch/rn/core/jsi/PyTorchCoreJSIModulePackage.java'
);

// Contenido actualizado para el archivo JSIModulePackage
const updatedJSI = `
package org.pytorch.rn.core.jsi;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PyTorchCoreJSIModulePackage extends TurboReactPackage {
  
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    return null; // Implementación requerida pero no utilizada
  }
  
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, com.facebook.react.module.model.ReactModuleInfo> moduleInfos = new HashMap<>();
      return moduleInfos;
    };
  }
}
`;

// Escribir el archivo actualizado
if (fs.existsSync(jsiPath)) {
  try {
    fs.writeFileSync(jsiPath, updatedJSI);
    console.log('✅ PyTorchCoreJSIModulePackage.java actualizado con éxito');
  } catch (error) {
    console.error('❌ Error al actualizar JSIModulePackage:', error);
  }
} else {
  console.error('❌ No se pudo encontrar el archivo JSIModulePackage.java');
}

console.log('🚀 Intenta compilar de nuevo:');
console.log('cd android && ./gradlew clean && cd .. && npx expo run:android');