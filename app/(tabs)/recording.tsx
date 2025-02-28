import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Mic as Mic2 } from 'lucide-react-native'

export default function RecordingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Nueva Grabación</Text>
        <TouchableOpacity style={styles.recordButton}>
          <Mic2 size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.hint}>Toca para empezar a grabar</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0cfbe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  hint: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
})
