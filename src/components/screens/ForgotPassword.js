import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import {
  requestResetOtp,
  verifyResetOtp,
  resetPassword,
  resetAuthResetState,
} from "../../store/index";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
  danger: "#FF5C5C",
  successBg: "#DFF7E1",
};

export default function ForgotPassword({ onDone }) {
  const dispatch = useDispatch();
  const { loading, step, resetToken, successMessage, errorMessage } =
    useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  useEffect(() => {
    return () => dispatch(resetAuthResetState());
  }, [dispatch]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => {}, 3000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage && step === 1) {
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [successMessage, step]);

  useEffect(() => {
    if (successMessage && step === 1 && showRedirectMessage) {
      const timer = setTimeout(() => {
        if (typeof onDone === "function") {
          onDone();
        }
        setShowRedirectMessage(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, step, showRedirectMessage, onDone]);

  const handleSendOtp = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return (
        dispatch(resetAuthResetState()) ||
        dispatch({ type: "authReset/setValidationError", payload: null })
      );
    }
    dispatch(requestResetOtp({ email }));
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) {
      return (
        dispatch(resetAuthResetState()) ||
        dispatch({ type: "authReset/setValidationError", payload: null })
      );
    }
    dispatch(verifyResetOtp({ email, otp }));
  };

  const handleResetPassword = () => {
    dispatch({ type: "authReset/clearError" });

    if (!password || password.length < 6) {
      return dispatch({
        type: "authReset/setErrorMessage",
        payload: "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return dispatch({
        type: "authReset/setErrorMessage",
        payload: "Passwords do not match",
      });
    }

    if (!resetToken) {
      return dispatch({
        type: "authReset/setErrorMessage",
        payload: "Reset token missing. Please verify OTP again.",
      });
    }

    dispatch(
      resetPassword({
        email,
        reset_token: resetToken,
        password,
        password_confirmation: confirmPassword,
      })
    ).then((res) => {
      if (res.type === "authReset/resetPassword/fulfilled") {
        setShowRedirectMessage(true);
        setEmail("");
        setOtp("");
        setPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <LinearGradient
      colors={[colors.primaryBg, colors.secondaryBg]}
      style={styles.page}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.header}>Forgot Password</Text>
          <Text style={styles.subHeader}>Reset your account password</Text>

          {successMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.text + "80"}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {step === 1 && !showRedirectMessage && (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryBg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.smallNote}>
                We'll email you a 6-digit code to reset your password.
              </Text>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.text + "80"}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.otpInput]}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryBg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => dispatch(requestResetOtp({ email }))}
                disabled={loading}
              >
                <Text style={styles.link}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && !showRedirectMessage && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.text + "80"}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.text + "80"}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryBg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {!showRedirectMessage && (
            <View style={styles.bottomRow}>
              <TouchableOpacity
                style={[styles.navBtn, { justifyContent: "flex-start" }]}
                onPress={() => {
                  if (typeof onDone === "function") onDone();
                }}
              >
                <Text style={styles.navBtnText}>Back to Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navBtn, { justifyContent: "flex-end" }]}
                onPress={() => {
                  dispatch(resetAuthResetState());
                  setEmail("");
                  setOtp("");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={styles.navBtnText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: colors.secondaryBg + "E6",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  header: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subHeader: {
    color: colors.text + "CC",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },
  successContainer: {
    marginBottom: 10,
  },
  successBox: {
    backgroundColor: colors.successBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  successText: {
    color: "#0A6B2E",
    fontWeight: "600",
    textAlign: "center",
  },
  redirectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBg + "80",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + "40",
  },
  redirectText: {
    color: colors.accent,
    marginLeft: 8,
    fontWeight: "500",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: colors.danger + "20",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: { color: colors.danger },
  field: { marginBottom: 12 },
  label: { color: colors.text, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.primaryBg + "50",
    color: colors.text,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.text + "20",
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 3,
    fontSize: 18,
    paddingVertical: 14,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: colors.primaryBg, fontWeight: "700", fontSize: 16 },
  disabledBtn: { opacity: 0.8 },
  link: {
    color: colors.text,
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  secondaryBtn: { marginTop: 12, alignItems: "center" },
  secondaryText: { color: colors.text + "CC" },
  smallNote: {
    color: colors.text + "99",
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  navBtnText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
