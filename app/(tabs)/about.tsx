import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con degradado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LipsTalk</Text>
        <Text style={styles.headerSubtitle}>Lectura de labios y trancipción a texto</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Sección de descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre la aplicación</Text>
          <Text style={styles.description}>
            LipsTalk es una aplicación de lectura de labios que permite a los usuarios grabar videos 
            de hasta 20 segundos. Al finalizar la grabación, la aplicación transcribe automáticamente 
            el contenido hablado en texto, facilitando la comunicación y mejorando la accesibilidad 
            para personas con dificultades auditivas o en entornos ruidosos.
          </Text>
        </View>
        
        {/* Características principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características principales</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="videocam" size={24} color="#FF3B30" style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Grabación de video</Text>
              <Text style={styles.featureDescription}>
                Utiliza tanto la cámara frontal como la trasera del dispositivo.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="person" size={24} color="#FF3B30" style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Posicionamiento facial</Text>
              <Text style={styles.featureDescription}>
                Requiere que el usuario alinee su rostro en la posición indicada para garantizar una transcripción precisa.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="timer" size={24} color="#FF3B30" style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Límite de tiempo</Text>
              <Text style={styles.featureDescription}>
                La grabación se detiene automáticamente al alcanzar los 20 segundos y comienza el proceso de transcripción.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="list" size={24} color="#FF3B30" style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Historial de transcripciones</Text>
              <Text style={styles.featureDescription}>
                Acceso a un registro de transcripciones anteriores, ordenadas por fecha y hora, para una fácil consulta.
              </Text>
            </View>
          </View>
        </View>
        
        {/* Pantallas de la app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pantallas principales</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="camera" size={22} color="#FFF" />
              <Text style={styles.cardTitle}>LipsTalk</Text>
            </View>
            <Text style={styles.cardContent}>
              Pantalla principal donde los usuarios pueden iniciar la grabación, elegir entre cámara frontal o trasera, 
              y una vez finalizada la grabación, el video se transcribirá de forma automática.
            </Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={22} color="#FFF" />
              <Text style={styles.cardTitle}>Historial de Transcripciones</Text>
            </View>
            <Text style={styles.cardContent}>
              Accede al historial de transcripciones ordenadas por fecha y hora en el formato DD-MM-AAAA_HH:MM:SS,
              con opciones para visualizar, filtrar, eliminar y escuchar las transcripciones mediante síntesis de voz.
            </Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="videocam" size={22} color="#FFF" />
              <Text style={styles.cardTitle}>Historial de Grabaciones</Text>
            </View>
            <Text style={styles.cardContent}>
              Permite acceder a los videos grabados anteriormente, con posibilidad de visualizarlos, filtrarlos por fecha,
              eliminarlos y enviarlos nuevamente para ser transcritos cuando sea necesario.
            </Text>
          </View>
        </View>
        
        {/* Información del desarrollo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desarrolladores</Text>
          
          <View style={styles.developerItem}>
            <Ionicons name="code-slash" size={22} color="#FF3B30" style={styles.developerIcon} />
            <View>
              <Text style={styles.developerRole}>Desarrollador de la app</Text>
              <Text style={styles.developerName}>Josep Martinez Boix</Text>
            </View>
          </View>
          
          <View style={styles.developerItem}>
            <Ionicons name="analytics" size={22} color="#FF3B30" style={styles.developerIcon} />
            <View>
              <Text style={styles.developerRole}>Desarrollador del modelo de transcripción</Text>
              <Text style={styles.developerName}>David Gimeno Gómez</Text>
            </View>
          </View>
        </View>
        
        {/* Contexto académico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contexto académico</Text>
          <Text style={styles.academicText}>
            Esta aplicación ha sido desarrollada como parte del Trabajo de Fin de Grado (TFG) 
            de la titulación Grado de Ingeniería Informática en la UPV bajo la supervisión de 
            Carlos David Martinez Hinarejos y David Gimeno Gómez.
          </Text>
          
          <View style={styles.institutionContainer}>
            <Text style={styles.institutionText}>Universidad Politécnica de Valencia</Text>
          </View>
        </View>
        
        {/* Footer con versión */}
        <View style={styles.footer}>
          <Text style={styles.version}>Versión 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 LipsTalk</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0cfbe',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
    paddingLeft: 10,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureIcon: {
    marginRight: 15,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cardContent: {
    padding: 15,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  developerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  developerIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  developerRole: {
    fontSize: 14,
    color: '#666',
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  academicText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 15,
  },
  institutionContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  institutionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  version: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
  },
});