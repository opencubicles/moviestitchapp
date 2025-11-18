import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { loginUser, setGuestMode } from "../../store/index";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
};

export default function LoginScreen({ onShowSignUp, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Navigate to the main appbar screen after successful login
      try {
        router.replace("/movies");
      } catch (navErr) {
        // If navigation fails for any reason, log but don't block login
        console.warn("Navigation to /appbar failed:", navErr);
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.message || "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primaryBg, colors.secondaryBg]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome to MovieStitch</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.text + "80"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.text + "80"}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity onPress={onForgotPassword}>
            <Text
              style={{ color: "#fff", textAlign: "right", marginBottom: 15 }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onShowSignUp} style={styles.signUp}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <Text style={styles.signUpButton}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              dispatch(setGuestMode());
              router.replace("/movies/movies");
            }}
            style={styles.guestButton}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: colors.secondaryBg + "90",
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text + "80",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.primaryBg + "50",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.text + "20",
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: colors.accent + "50",
  },
  loginButtonText: {
    color: colors.primaryBg,
    fontSize: 18,
    fontWeight: "bold",
  },
  signUp: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: 20,
    fontSize: 18,
  },
  signUpText: {
    color: colors.text,
  },
  signUpButton: {
    color: colors.text,
    textDecorationLine: "underline",
    fontWeight: "semibold",
  },
  guestButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.text + "40",
    alignItems: "center",
  },
  guestButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
