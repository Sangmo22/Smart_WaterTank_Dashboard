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
  Image,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google Modal State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleAccounts, setGoogleAccounts] = useState<{ email: string; name: string }[]>([
    { email: "sangmolama29@gmail.com", name: "Sangmo Lama" },
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
            { email: "sangmolama29@gmail.com", name: "Sangmo Lama" },
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (isSignUp && username.trim().length < 2) {
      setError("Username must be at least 2 characters long");
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

    const result = await loginWithGoogle(selectedEmail, name);
    setGoogleLoading(false);

    if (result && !result.success) {
      setError(result.error || "Google Sign-In failed.");
      setGoogleModalVisible(false);
      setShowCustomGoogle(false);
      return;
    }

    // Save custom email to account suggestions list in AsyncStorage only on successful login
    const defaults = ["sangmolama29@gmail.com", "watertank.admin@gmail.com", "guest.user@gmail.com"];
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

    setError(null);
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
                {isSignUp ? "Username" : "Username or Email"}
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
                  placeholder={isSignUp ? "Enter your username" : "Enter your username or email"}
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
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  <SymbolView
                    name={
                      showPassword
                        ? { ios: "eye.slash.fill", android: "visibility_off", web: "visibility_off" }
                        : { ios: "eye.fill", android: "visibility", web: "visibility" }
                    }
                    size={20}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
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
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ padding: 4 }}
                  >
                    <SymbolView
                      name={
                        showConfirmPassword
                          ? { ios: "eye.slash.fill", android: "visibility_off", web: "visibility_off" }
                          : { ios: "eye.fill", android: "visibility", web: "visibility" }
                      }
                      size={20}
                      tintColor={theme.textSecondary}
                    />
                  </Pressable>
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
              styles.googleCard,
              { backgroundColor: "#ffffff" },
            ]}
          >
            {googleLoading ? (
              <View style={styles.googleLoadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <ThemedText type="smallBold" style={{ marginTop: Spacing.three, color: "#3c4043" }}>
                  Connecting to Google Account...
                </ThemedText>
              </View>
            ) : (
              <View>
                {/* Header bar: "Sign in with Google" */}
                <View style={styles.googleCardHeader}>
                  <View style={styles.googleCardHeaderLeft}>
                    {/* Google G logo */}
                    <View style={styles.googleMiniLogo}>
                      <ThemedText style={styles.googleMiniG}>G</ThemedText>
                    </View>
                    <ThemedText style={styles.googleCardHeaderTitle}>Sign in with Google</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => {
                      setGoogleModalVisible(false);
                      setShowCustomGoogle(false);
                    }}
                    style={({ pressed }) => [
                      styles.googleCardCloseBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <SymbolView
                      name={{ ios: "xmark", android: "close", web: "close" }}
                      size={18}
                      tintColor="#5f6368"
                    />
                  </Pressable>
                </View>
                <View style={styles.headerDivider} />

                {/* Card Body */}
                <View style={styles.googleCardBody}>
                  {/* Left Column: Choose Account Details */}
                  <View style={styles.googleCardLeftColumn}>
                    {/* Custom Logo (app icon/favicon) */}
                    <Image
                      source={require("../../assets/images/favicon.png")}
                      style={styles.googleCardAppLogo}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.googleCardHeading}>Choose an account</ThemedText>
                    <ThemedText style={styles.googleCardSubtext}>
                      to continue to <ThemedText style={styles.googleCardLinkText}>Smart Water Tank</ThemedText>
                    </ThemedText>
                  </View>

                  {/* Right Column: Account Choices / Custom Entry Form */}
                  <View style={styles.googleCardRightColumn}>
                    {!showCustomGoogle ? (
                      <View style={{ flex: 1 }}>
                        <ScrollView style={styles.googleCardAccountsScroll} showsVerticalScrollIndicator={false}>
                          {googleAccounts.map((acc, index) => {
                            const isSangmo = acc.email.toLowerCase() === "sangmolama29@gmail.com";
                            const initial = acc.name.charAt(0).toUpperCase();
                            const avatarColors = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#722ed1"];
                            const avatarColor = avatarColors[index % avatarColors.length];

                            return (
                              <View key={acc.email}>
                                <Pressable
                                  onPress={() => handleGoogleSelect(acc.email, acc.name)}
                                  style={({ pressed }) => [
                                    styles.googleCardAccountRow,
                                    pressed && { backgroundColor: "#f5f5f5" },
                                  ]}
                                >
                                  {isSangmo ? (
                                    <View style={styles.googleCardAvatarCircle}>
                                      <SymbolView
                                        name={{ ios: "person.crop.circle.fill", android: "account_circle", web: "account_circle" }}
                                        size={36}
                                        tintColor="#4285F4"
                                      />
                                    </View>
                                  ) : (
                                    <View style={[styles.googleCardAvatarCircle, { backgroundColor: avatarColor }]}>
                                      <ThemedText style={styles.googleCardAvatarText}>{initial}</ThemedText>
                                    </View>
                                  )}
                                  <View style={styles.googleCardAccountDetails}>
                                    <ThemedText style={styles.googleCardAccountName}>{acc.name}</ThemedText>
                                    <ThemedText style={styles.googleCardAccountEmail}>{acc.email}</ThemedText>
                                  </View>
                                </Pressable>
                                <View style={styles.rowDivider} />
                              </View>
                            );
                          })}

                          {/* Use another account */}
                          <Pressable
                            onPress={() => setShowCustomGoogle(true)}
                            style={({ pressed }) => [
                              styles.googleCardAccountRow,
                              pressed && { backgroundColor: "#f5f5f5" },
                            ]}
                          >
                            <View style={[styles.googleCardAvatarCircle, { backgroundColor: "#f1f3f4" }]}>
                              <SymbolView
                                name={{ ios: "person.badge.plus", android: "person_add", web: "person_add" }}
                                size={18}
                                tintColor="#5f6368"
                              />
                            </View>
                            <View style={styles.googleCardAccountDetails}>
                              <ThemedText style={[styles.googleCardAccountName, { color: "#3c4043", fontWeight: "500" }]}>
                                Use another account
                              </ThemedText>
                            </View>
                          </Pressable>
                          <View style={styles.rowDivider} />
                        </ScrollView>

                        {/* Footer Privacy Info */}
                        <ThemedText style={styles.googleCardFooterText}>
                          Before using this app, you can review Smart Water Tank's{" "}
                          <ThemedText style={styles.googleCardFooterLink}>Privacy Policy</ThemedText> and{" "}
                          <ThemedText style={styles.googleCardFooterLink}>Terms of Service</ThemedText>.
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.googleCardCustomForm}>
                        <ThemedText style={styles.googleCardFormTitle}>
                          Sign in with a different Google account
                        </ThemedText>
                        
                        <View style={styles.googleCardInputWrapper}>
                          <TextInput
                            placeholder="Email address (e.g. john@gmail.com)"
                            placeholderTextColor="#9aa0a6"
                            value={customGoogleEmail}
                            onChangeText={setCustomGoogleEmail}
                            style={styles.googleCardTextInput}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        
                        <View style={[styles.googleCardInputWrapper, { marginTop: 16 }]}>
                          <TextInput
                            placeholder="Full name"
                            placeholderTextColor="#9aa0a6"
                            value={customGoogleName}
                            onChangeText={setCustomGoogleName}
                            style={styles.googleCardTextInput}
                            autoCapitalize="words"
                            autoCorrect={false}
                          />
                        </View>

                        <View style={styles.googleCardFormActions}>
                          <Pressable
                            onPress={() => setShowCustomGoogle(false)}
                            style={({ pressed }) => [
                              styles.googleCardFormBackBtn,
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <ThemedText style={styles.googleCardFormBackText}>Back</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={handleCustomGoogleSubmit}
                            style={({ pressed }) => [
                              styles.googleCardFormSubmitBtn,
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            <ThemedText style={styles.googleCardFormSubmitText}>Next</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
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
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
  googleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dadce0",
    width: "100%",
    maxWidth: Platform.OS === 'web' ? 780 : 360,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  googleLoadingContainer: {
    padding: Spacing.six,
    alignItems: "center",
    justifyContent: "center",
  },
  googleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  googleCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  googleMiniLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dadce0",
  },
  googleMiniG: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4285F4",
  },
  googleCardHeaderTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3c4043",
  },
  googleCardCloseBtn: {
    padding: 4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#dadce0",
  },
  googleCardBody: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    padding: 32,
    gap: 32,
  },
  googleCardLeftColumn: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minWidth: Platform.OS === 'web' ? 260 : "100%",
  },
  googleCardAppLogo: {
    width: 32,
    height: 32,
    marginBottom: 16,
  },
  googleCardHeading: {
    fontSize: 24,
    fontWeight: "400",
    color: "#202124",
    marginBottom: 8,
  },
  googleCardSubtext: {
    fontSize: 14,
    color: "#5f6368",
  },
  googleCardLinkText: {
    color: "#1a73e8",
    fontWeight: "500",
  },
  googleCardRightColumn: {
    flex: 1.2,
    justifyContent: "flex-start",
    minWidth: Platform.OS === 'web' ? 320 : "100%",
  },
  googleCardAccountsScroll: {
    maxHeight: 220,
  },
  googleCardAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 4,
  },
  googleCardAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  googleCardAvatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  googleCardAccountDetails: {
    flex: 1,
  },
  googleCardAccountName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3c4043",
  },
  googleCardAccountEmail: {
    fontSize: 12,
    color: "#5f6368",
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#dadce0",
  },
  googleCardFooterText: {
    fontSize: 11,
    color: "#5f6368",
    lineHeight: 16,
    marginTop: 20,
  },
  googleCardFooterLink: {
    color: "#1a73e8",
  },
  googleCardCustomForm: {
    flex: 1,
    justifyContent: "flex-start",
  },
  googleCardFormTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3c4043",
    marginBottom: 16,
  },
  googleCardInputWrapper: {
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  googleCardTextInput: {
    fontSize: 14,
    color: "#202124",
    padding: 0,
  },
  googleCardFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 24,
    gap: 16,
  },
  googleCardFormBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  googleCardFormBackText: {
    color: "#1a73e8",
    fontWeight: "500",
    fontSize: 14,
  },
  googleCardFormSubmitBtn: {
    backgroundColor: "#1a73e8",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  googleCardFormSubmitText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 14,
  },
});
