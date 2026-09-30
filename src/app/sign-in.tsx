import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { supabase } from "../lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignIn() {
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>✦ MONEVO</Text>

      <Text style={styles.title}>Welcome back</Text>

      <Text style={styles.subtitle}>
        Sign in to continue to your Monevo account.
      </Text>

      <Text style={styles.label}>Email</Text>

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Your password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <Pressable
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/sign-up")}>
        <Text style={styles.bottomText}>
          Don't have an account? <Text style={styles.link}>Create one</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logo: {
    color: "#20B486",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 30,
  },
  title: {
    color: "#102A43",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 32,
  },
  label: {
    color: "#17202A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#17202A",
    marginBottom: 18,
  },
  message: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#20B486",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 24,
    fontSize: 14,
  },
  link: {
    color: "#20B486",
    fontWeight: "700",
  },
});
