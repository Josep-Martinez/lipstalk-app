import { Tabs } from "expo-router";
import { Home, MessageSquare, Video, InfoIcon } from "lucide-react-native";
import { View, StyleSheet, Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#e0cfbe", // Fondo del header
        },
        headerTintColor: "#fff", // Color del texto header
        tabBarStyle: {
          backgroundColor: "#fff", // Fondo de la barra de abajo
          borderTopWidth: 1, // Borde superior de la barra
          borderTopColor: "#e2e8f0", // Color del borde 
        },
        tabBarActiveTintColor: "#e0cfbe", // Color del icono pulsado
        tabBarInactiveTintColor: "#64748b", // Color del icono no pulsado
      }}
    >
      {/* Pestaña de grabaciones */}
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

      {/* Pestaña de inicio*/}
      <Tabs.Screen
        name="index"
        options={{
          title: "LipsTalk",
          headerTitle: "LipsTalk",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/lipstalk-logo.png")}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      {/* Pestaña de videos */}
      <Tabs.Screen
        name="videos"
        options={{
          title: "Video",
          headerTitle: "Video",
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />

      {/* Pestaña de información*/}
      <Tabs.Screen
        name="about"
        options={{
          title: "Info",
          headerTitle: "Info",
          tabBarIcon: ({ color, size }) => <InfoIcon size={size} color={color} />,
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
