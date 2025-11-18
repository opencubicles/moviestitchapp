import { useState, useEffect, useRef } from "react";
import { StyleSheet, Alert, Animated, View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Provider as ReduxProvider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import store from "../store/index";
import { checkAuthStatus } from "../store/index";
import { useRouter } from "expo-router";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
  primaryAction: "#D32F2F",
  secondaryAction: "#455A64",
};

export default function AppWrapper() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <PaperProvider>
          <App />
        </PaperProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

function App() {
  const router = useRouter();
  const dispatch = useDispatch();
  const selectedMovie = useSelector((state) => state.movie.selectedMovie);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authLoading = useSelector((state) => state.auth.loading);
  const isGuest = useSelector((state) => state.auth.isGuest);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated && !isGuest) {
      router.replace("/auth/login");
    } else if (isAuthenticated || isGuest) {
      if (!selectedMovie) router.replace("/movies/movies");
    }
  }, [isAuthenticated, selectedMovie, authLoading]);

  return (
    <View
      style={[
        styles.container,
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Text style={{ color: colors.text }}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
