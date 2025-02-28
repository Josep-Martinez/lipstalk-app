import { View, Text, StyleSheet } from 'react-native'

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About Lipstalk</Text>
        <Text style={styles.description}>
          Welcome to Lipstalk, your elegant note-taking companion. Create and
          organize your thoughts with style and simplicity.
        </Text>
        <View style={styles.versionContainer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e0cfbe',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  versionContainer: {
    padding: 10,
    backgroundColor: '#f8f4f1',
    borderRadius: 8,
  },
  version: {
    fontSize: 14,
    color: '#64748b',
  },
})
