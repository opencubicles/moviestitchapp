import React, { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useRouter } from "expo-router";
import { useAudioPlayer } from "expo-audio";

export default function SplashWelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [stage, setStage] = useState("splash");

  const WELCOME_IMAGE =
    "https://static.wixstatic.com/media/241d90_4e94af075d4b4a18989d3404c279eac5~mv2.gif";

  const player = useAudioPlayer(require("../assets/Stitchmo_Audio.mp3"));

  useEffect(() => {
    startSequence();
  }, []);

  const startSequence = async () => {
    try {
      // ✅ Prevent the native splash from hiding automatically
      await SplashScreen.preventAutoHideAsync();

      // Play splash fade-in/out
      await playSplashAnimation();

      // Play welcome animation + audio
      await playWelcomeSequence();

      // Hide native splash and navigate
      await SplashScreen.hideAsync();
      router.replace("/movies");
    } catch (e) {
      console.error("Splash sequence error:", e);
      router.replace("/movies");
    }
  };

  const playSplashAnimation = () =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStage("welcome");
        resolve();
      });
    });

  const playWelcomeSequence = async () => {
    try {
      await player.play();
    } catch (e) {
      console.warn("Audio play error:", e);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    return new Promise<void>((resolve) => setTimeout(resolve, 4000));
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: stage === "splash" ? "#1C2526" : "#fab81e" },
      ]}
    >
      {stage === "splash" ? (
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          Movie Stitch
        </Animated.Text>
      ) : (
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image
            source={{ uri: WELCOME_IMAGE }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#F5F6F5",
    fontSize: 28,
    fontWeight: "700",
  },
  content: {
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
  },
});
