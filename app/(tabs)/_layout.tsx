import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
          height: 0,
        }, // Hide the bottom tab bar completely
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "סמנטעל", // Semantle in Hebrew
        }}
      />
    </Tabs>
  );
}
