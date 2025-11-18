import React from "react";
import { Slot } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import store from "../src/store";

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <PaperProvider>
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
