import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
} from "react-native";
import { Audio } from "expo-audio";
import { Asset } from "expo-asset";

const Welcome = ({ onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [sound, setSound] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const WELCOME_IMAGE =
    "https://static.wixstatic.com/media/241d90_4e94af075d4b4a18989d3404c279eac5~mv2.gif";

  useEffect(() => {
    console.log("🎬 Welcome screen mounted");
    let autoNavigateTimer;

    const setup = async () => {
      console.log("🔈 Setting up welcome audio...");
      await initializeAudio();

      autoNavigateTimer = setTimeout(() => {
        console.log("🕓 Auto navigate triggered");
        handleContinue();
      }, 4500);
    };

    setup();

    return () => {
      console.log("👋 Cleaning up Welcome");
      if (autoNavigateTimer) clearTimeout(autoNavigateTimer);
      cleanupAudio();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      console.log("🎧 Initializing expo-audio...");

      // Load audio asset using expo-asset
      const asset = Asset.fromModule(
        require("../../../assets/Stitchmo_Audio.mp3")
      );
      await asset.downloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: asset.localUri },
        { shouldPlay: false }
      );

      setSound(newSound);
      console.log("✅ Audio loaded successfully!");
      setIsLoading(false);
      startAnimations();

      // Play after animation starts
      setTimeout(() => {
        playAudio(newSound);
      }, 500);
    } catch (error) {
      console.error("❌ Error initializing audio:", error);
      setIsLoading(false);
      startAnimations();
    }
  };

  const playAudio = async (audioObj) => {
    try {
      if (audioObj) {
        await audioObj.playAsync();
        console.log("▶️ Audio playing...");
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const cleanupAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        console.log("🧹 Audio cleaned up.");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  const handleContinue = async () => {
    try {
      await cleanupAudio();
      console.log("⏹️ Audio stopped and unloaded.");
    } catch (error) {
      console.error("Error stopping audio:", error);
    }

    // Navigate to next screen
    onComplete();
  };

  const startAnimations = () => {
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
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
          <Image
            source={{ uri: WELCOME_IMAGE }}
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fab81e",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  loadingText: {
    color: "#1C2526",
    fontSize: 16,
  },
});

export default Welcome;
