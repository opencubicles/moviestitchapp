import React from "react";
import { useRouter } from "expo-router";
import LoginScreen from "../../src/components/screens/LoginScreen";

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onShowSignUp={() => router.push("/auth/signup")}
      onForgotPassword={() => router.push("/auth/forgot-password")}
    />
  );
}
