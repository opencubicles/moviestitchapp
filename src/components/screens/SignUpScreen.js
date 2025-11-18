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
import { signupUser, setGuestMode } from "../../store/index";
import { useRouter } from "expo-router";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
};

export default function SignUpScreen({ onShowLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        signupUser({
          name,
          email,
          password,
          password_confirmation: confirmPassword,
        })
      ).unwrap();
      try {
        router.replace("/auth/login");
      } catch (navErr) {
        console.warn("Navigation to /login failed:", navErr);
      }
    } catch (error) {
      Alert.alert(
        "Sign Up Failed",
        error || "An error occurred during sign up"
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
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.text + "80"}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.text + "80"}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onShowLogin} style={styles.signUp}>
            <Text style={styles.signUpText}>Already have an account?</Text>
            <Text style={styles.signUpButton}>Login</Text>
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
    fontSize: 26,
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
