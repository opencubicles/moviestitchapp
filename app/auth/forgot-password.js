import React from "react";
import { useRouter } from "expo-router";
import ForgotPasswordScreen from "../../src/components/screens/ForgotPassword";

export default function ForgotPasswordRoute() {
  const router = useRouter();
  return <ForgotPasswordScreen onDone={() => router.back()} />;
}
