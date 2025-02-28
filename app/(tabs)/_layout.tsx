import { Tabs } from "expo-router";
import { Home, MessageSquare, Video } from "lucide-react-native";
import { View, StyleSheet, Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#e0cfbe",
        },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
        },
        tabBarActiveTintColor: "#e0cfbe",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="recording"
        options={{
          title: "Grabaciones",
          headerTitle: "Grabaciones",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Casa",
          headerTitle: "Casa",
          headerRight: () => (
            <View style={styles.headerRight}>
              <Image
                source={require("../../assets/images/lipstalk-logo.png")}
                style={styles.headerIcon}
              />
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Video',
          headerTitle: 'Video',
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "LipsTalk",
          headerTitle: "LipsTalk",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/lipstalk-logo.png")}
              style={{
                width: size,
                height: size,
                tintColor: color, // Esto permite que la imagen cambie de color según el estado activo/inactivo
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
});
