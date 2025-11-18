import React from "react";
import { useRouter } from "expo-router";
import SignUpScreen from "../../src/components/screens/SignUpScreen";

export default function SignUpRoute() {
  const router = useRouter();
  return <SignUpScreen onShowLogin={() => router.push("/auth/login")} />;
}
