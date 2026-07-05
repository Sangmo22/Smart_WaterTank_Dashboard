import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useAuth } from "@/state/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function LoginScreen() {
  const { login, signup, loginWithGoogle } = useAuth();
  const theme = useTheme();

  // Screen State
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Modal State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleAccounts, setGoogleAccounts] = useState<{ email: string; name: string }[]>([
    { email: "watertank.admin@gmail.com", name: "Water Tank Admin" },
    { email: "guest.user@gmail.com", name: "Guest User" },
  ]);

  // Load saved Google accounts on mount or modal visibility change
  useEffect(() => {
    (async () => {
      try {
        const savedAccountsJson = await AsyncStorage.getItem("@google_accounts_list");
        if (savedAccountsJson) {
          const parsed = JSON.parse(savedAccountsJson);
          const defaultAccounts = [
            { email: "watertank.admin@gmail.com", name: "Water Tank Admin" },
            { email: "guest.user@gmail.com", name: "Guest User" },
          ];
          const combined = [...defaultAccounts];
          parsed.forEach((acc: any) => {
            if (!combined.some((c) => c.email.toLowerCase() === acc.email.toLowerCase())) {
              combined.push(acc);
            }
          });
          setGoogleAccounts(combined);
        }
      } catch (err) {
        console.error("Failed to load Google accounts:", err);
      }
    })();
  }, [googleModalVisible]);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const handleStandardSubmit = async () => {
    setError(null);
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (isSignUp && !email.trim()) {
      setError("Email is required");
      return;
    }
    if (isSignUp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signup(username, password, email);
        if (!result.success) {
          setError(result.error ?? "Registration failed.");
        }
      } else {
        const result = await login(username, password);
        if (!result.success) {
          setError(result.error ?? "Invalid username or password.");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSelect = async (selectedEmail: string, name: string) => {
    setGoogleLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Save custom email to account suggestions list in AsyncStorage
    const defaults = ["watertank.admin@gmail.com", "guest.user@gmail.com"];
    if (!defaults.includes(selectedEmail.toLowerCase())) {
      try {
        const savedAccountsJson = await AsyncStorage.getItem("@google_accounts_list");
        const savedAccounts = savedAccountsJson ? JSON.parse(savedAccountsJson) : [];
        if (!savedAccounts.some((acc: any) => acc.email.toLowerCase() === selectedEmail.toLowerCase())) {
          savedAccounts.push({ email: selectedEmail, name });
          await AsyncStorage.setItem("@google_accounts_list", JSON.stringify(savedAccounts));
        }
      } catch (err) {
        console.error("Failed to save Google account suggestion:", err);
      }
    }

    await loginWithGoogle(selectedEmail, name);
    setGoogleLoading(false);
    setGoogleModalVisible(false);
    setShowCustomGoogle(false);
    setCustomGoogleEmail("");
    setCustomGoogleName("");
  };

  const handleCustomGoogleSubmit = () => {
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) {
      setError("All fields are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customGoogleEmail)) {
      setError("Please enter a valid Google email");
      return;
    }
    handleGoogleSelect(customGoogleEmail, customGoogleName);
  };

  const inputBg = theme.backgroundSelected;
  const cardBg = theme.backgroundElement;
  const isWeb = Platform.OS === "web";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isWeb && { maxWidth: 440, alignSelf: "center", width: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <SymbolView
              name={{
                ios: "drop.fill",
                android: "opacity",
                web: "opacity",
              }}
              size={36}
              tintColor="#1890ff"
            />
          </View>
          <ThemedText type="subtitle" style={styles.appName}>
            Smart Water Tank
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Monitor and automate your water usage
          </ThemedText>
        </View>

        <View
          style={[
            styles.authCard,
            { backgroundColor: cardBg, borderColor: theme.backgroundSelected },
          ]}
        >
          {/* Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => {
                if (isSignUp) handleToggleMode();
              }}
              style={[
                styles.tabButton,
                !isSignUp && { borderBottomColor: "#1890ff" },
              ]}
            >
              <ThemedText
                type="smallBold"
                style={[
                  styles.tabText,
                  { color: !isSignUp ? "#1890ff" : theme.textSecondary },
                ]}
              >
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!isSignUp) handleToggleMode();
              }}
              style={[
                styles.tabButton,
                isSignUp && { borderBottomColor: "#1890ff" },
              ]}
            >
              <ThemedText
                type="smallBold"
                style={[
                  styles.tabText,
                  { color: isSignUp ? "#1890ff" : theme.textSecondary },
                ]}
              >
                Sign Up
              </ThemedText>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorAlert}>
                <SymbolView
                  name={{
                    ios: "exclamationmark.triangle.fill",
                    android: "warning",
                    web: "warning",
                  }}
                  size={16}
                  tintColor="#ff4d4f"
                />
                <ThemedText style={styles.errorAlertText}>{error}</ThemedText>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.inputLabel}>
                Username or Email
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <SymbolView
                  name={{ ios: "person.fill", android: "person", web: "person" }}
                  size={16}
                  tintColor={theme.textSecondary}
                />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  Email Address
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                  <SymbolView
                    name={{ ios: "envelope.fill", android: "mail", web: "mail" }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.inputLabel}>
                Password
              </ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <SymbolView
                  name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                  size={16}
                  tintColor={theme.textSecondary}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text }]}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  Confirm Password
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                  <SymbolView
                    name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            <Pressable
              onPress={handleStandardSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: "#1890ff" },
                pressed && { opacity: 0.8 },
                isSubmitting && { opacity: 0.7 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitButtonText}>
                  {isSignUp ? "Create Account" : "Sign In"}
                </ThemedText>
              )}
            </Pressable>

            {/* Separator */}
            <View style={styles.separatorRow}>
              <View style={[styles.separatorLine, { backgroundColor: theme.backgroundSelected }]} />
              <ThemedText type="small" style={styles.separatorText} themeColor="textSecondary">
                or
              </ThemedText>
              <View style={[styles.separatorLine, { backgroundColor: theme.backgroundSelected }]} />
            </View>

            {/* Gmail Login */}
            <Pressable
              onPress={() => setGoogleModalVisible(true)}
              style={({ pressed }) => [
                styles.googleButton,
                { backgroundColor: theme.backgroundSelected },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.googleIconWrapper}>
                <ThemedText style={[styles.googleIconText, { color: "#000" }]}>G</ThemedText>
              </View>
              <ThemedText type="smallBold" style={[styles.googleButtonText, { color: theme.text }]}>
                Login with Gmail
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={handleToggleMode}>
            <ThemedText type="smallBold" style={styles.footerLink}>
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      {/* Simulated Google Sign-In Modal */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!googleLoading) {
            setGoogleModalVisible(false);
            setShowCustomGoogle(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.googlePanel,
              { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
            ]}
          >
            {googleLoading ? (
              <View style={styles.googleLoadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
                  Connecting to Google Account...
                </ThemedText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.googlePanelContent}>
                <View style={styles.googleHeader}>
                  <View style={styles.googleLogo}>
                    <ThemedText style={[styles.googleG, { color: "#000" }]}>G</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.googleTitle}>
                    Sign in with Google
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.googleSubtitle}>
                    to continue to Smart Water Tank Monitor
                  </ThemedText>
                </View>

                {!showCustomGoogle ? (
                  <View style={styles.googleAccountsList}>
                    {googleAccounts.map((acc, index) => {
                      const initial = acc.name.charAt(0).toUpperCase();
                      const avatarColors = ["#1890ff", "#52c41a", "#722ed1", "#eb2f96", "#fa8c16"];
                      const avatarColor = avatarColors[index % avatarColors.length];

                      return (
                        <Pressable
                          key={acc.email}
                          onPress={() => handleGoogleSelect(acc.email, acc.name)}
                          style={({ pressed }) => [
                            styles.googleAccountItem,
                            { borderColor: theme.backgroundSelected },
                            pressed && { backgroundColor: theme.backgroundSelected },
                          ]}
                        >
                          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                            <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                          </View>
                          <View style={styles.accountInfo}>
                            <ThemedText type="smallBold">{acc.name}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {acc.email}
                            </ThemedText>
                          </View>
                        </Pressable>
                      );
                    })}

                    {/* Use Another Account */}
                    <Pressable
                      onPress={() => setShowCustomGoogle(true)}
                      style={({ pressed }) => [
                        styles.googleAccountItem,
                        { borderColor: theme.backgroundSelected },
                        pressed && { backgroundColor: theme.backgroundSelected },
                      ]}
                    >
                      <View style={[styles.avatarCircle, { backgroundColor: theme.backgroundSelected }]}>
                        <SymbolView
                          name={{ ios: "plus", android: "add", web: "add" }}
                          size={20}
                          tintColor={theme.text}
                        />
                      </View>
                      <View style={styles.accountInfo}>
                        <ThemedText type="smallBold">Use another account</ThemedText>
                      </View>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.customGoogleForm}>
                    <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>
                      Enter custom Gmail account details:
                    </ThemedText>
                    <View style={[styles.googleInputWrapper, { backgroundColor: inputBg }]}>
                      <TextInput
                        placeholder="Google Email (e.g. john@gmail.com)"
                        placeholderTextColor={theme.textSecondary}
                        value={customGoogleEmail}
                        onChangeText={setCustomGoogleEmail}
                        style={[styles.googleInput, { color: theme.text }]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={[styles.googleInputWrapper, { backgroundColor: inputBg, marginTop: Spacing.two }]}>
                      <TextInput
                        placeholder="Full Name"
                        placeholderTextColor={theme.textSecondary}
                        value={customGoogleName}
                        onChangeText={setCustomGoogleName}
                        style={[styles.googleInput, { color: theme.text }]}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.customGoogleActions}>
                      <Pressable
                        onPress={() => setShowCustomGoogle(false)}
                        style={({ pressed }) => [
                          styles.googleCancelBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <ThemedText type="smallBold" themeColor="textSecondary">
                          Back
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={handleCustomGoogleSubmit}
                        style={({ pressed }) => [
                          styles.googleSubmitBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <ThemedText type="smallBold" style={{ color: "#fff" }}>
                          Sign In
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    setGoogleModalVisible(false);
                    setShowCustomGoogle(false);
                  }}
                  style={({ pressed }) => [
                    styles.googleCloseBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: "#4285F4" }}>
                    Cancel
                  </ThemedText>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(24, 144, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.one,
  },
  authCard: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.12)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 16,
  },
  formContainer: {
    padding: Spacing.four,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "rgba(255, 77, 79, 0.1)",
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  errorAlertText: {
    color: "#ff4d4f",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.three,
    gap: Spacing.three,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    gap: Spacing.three,
  },
  googleIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "900",
  },
  googleButtonText: {
    fontSize: 15,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.four,
  },
  footerLink: {
    color: "#1890ff",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  googlePanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: Spacing.four,
    paddingBottom: Platform.select({ ios: Spacing.six, default: Spacing.four }),
    maxHeight: "85%",
  },
  googlePanelContent: {
    paddingHorizontal: Spacing.four,
  },
  googleHeader: {
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  googleLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  googleG: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4285F4",
  },
  googleTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  googleSubtitle: {
    textAlign: "center",
    marginTop: Spacing.one,
  },
  googleAccountsList: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  googleAccountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  accountInfo: {
    flex: 1,
  },
  googleCloseBtn: {
    alignItems: "center",
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  googleLoadingContainer: {
    padding: Spacing.five,
    alignItems: "center",
    justifyContent: "center",
  },
  customGoogleForm: {
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  googleInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    justifyContent: "center",
  },
  googleInput: {
    fontSize: 15,
  },
  customGoogleActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  googleCancelBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  googleSubmitBtn: {
    backgroundColor: "#4285F4",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
});
