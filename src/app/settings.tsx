import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, Clipboard } from "react-native";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { PageFrame } from "@/components/page-frame";
import { ThemedText } from "@/components/themed-text";
import { useThingSpeak } from "@/hooks/use-thingspeak";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getThemeMode, setThemeMode, ThemeMode } from "@/hooks/use-color-scheme.shared";
import { SymbolView } from "expo-symbols";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === "dark" ? "dark" : "light"];
  const { config } = useThingSpeak();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  const { expoPushToken, pushStatus, pushError } = usePushNotifications();
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyToken = () => {
    if (expoPushToken) {
      Clipboard.setString(expoPushToken);
      alert("Token copied to clipboard!");
    }
  };

  const handleSendTestNotification = async () => {
    setTestSending(true);
    setTestStatus(null);

    if (Platform.OS === "web") {
      const BrowserNotification = (globalThis as any).Notification;
      if (!BrowserNotification) {
        setTestStatus({ success: false, message: "Browser notifications not supported." });
        setTestSending(false);
        return;
      }

      const showLocalNotification = () => {
        new BrowserNotification("Smart Water Tank Test Alert", {
          body: "This is a local browser notification test! Everything is working correctly.",
        });
        setTestStatus({ success: true, message: "Local browser notification triggered!" });
        setTestSending(false);
      };

      if (BrowserNotification.permission === "granted") {
        showLocalNotification();
      } else if (BrowserNotification.permission !== "denied") {
        try {
          const permission = await BrowserNotification.requestPermission();
          if (permission === "granted") {
            showLocalNotification();
          } else {
            setTestStatus({ success: false, message: "Notification permission denied." });
            setTestSending(false);
          }
        } catch (err: any) {
          setTestStatus({ success: false, message: `Permission error: ${err.message}` });
          setTestSending(false);
        }
      } else {
        setTestStatus({ success: false, message: "Notification permission denied. Enable in site settings." });
        setTestSending(false);
      }
      return;
    }

    if (!expoPushToken) {
      setTestStatus({ success: false, message: "No push token available. Make sure notifications are ready." });
      setTestSending(false);
      return;
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: "default",
          title: "Smart Water Tank Test Alert",
          body: "This is a test notification from your dashboard! Your device is successfully linked.",
          data: { test: true },
          channelId: "water-alerts",
          priority: "high",
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.data?.status !== "error") {
        setTestStatus({ success: true, message: "Push notification request sent to Expo!" });
      } else {
        throw new Error(resData.data?.message || "Failed to send via Expo.");
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: `Failed: ${err.message}` });
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    setThemeModeState(getThemeMode());
  }, []);

  const handleThemeSelect = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setThemeMode(mode);
  };

  const themeOptions: { label: string; value: ThemeMode; icon: object; desc: string }[] = [
    {
      label: "Light",
      value: "light",
      icon: { ios: "sun.max.fill", android: "light_mode", web: "light_mode" },
      desc: "Always use the bright theme",
    },
    {
      label: "Dark",
      value: "dark",
      icon: { ios: "moon.fill", android: "dark_mode", web: "dark_mode" },
      desc: "Always use the dark theme",
    },
    {
      label: "System",
      value: "system",
      icon: { ios: "circle.lefthalf.filled", android: "brightness_auto", web: "brightness_auto" },
      desc: "Follow device setting",
    },
  ];

  return (
    <PageFrame
      title="Settings"
      subtitle="Channel and theme configuration"
      icon={{ ios: "gearshape.fill", android: "settings", web: "settings" }}
    >
      {/* Theme Selector */}
      <View style={[styles.section, { borderColor: theme.backgroundSelected }]}>
        <View style={styles.sectionHeader}>
          <SymbolView
            name={{ ios: "paintpalette.fill", android: "palette", web: "palette" }}
            size={16}
            tintColor={theme.text}
          />
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
          Choose between light and dark theme, or follow your device setting.
        </ThemedText>
        <View style={styles.themeOptionsRow}>
          {themeOptions.map((opt) => {
            const selected = themeMode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleThemeSelect(opt.value)}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    backgroundColor: selected
                      ? "#1d5cff"
                      : theme.backgroundElement,
                    borderColor: selected ? "#1d5cff" : theme.backgroundSelected,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <SymbolView
                  name={opt.icon as any}
                  size={22}
                  tintColor={selected ? "#fff" : theme.textSecondary}
                />
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? "#fff" : theme.text, fontSize: 13 }}
                >
                  {opt.label}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{
                    color: selected ? "rgba(255,255,255,0.75)" : theme.textSecondary,
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  {opt.desc}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Channel Info */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <SymbolView
            name={{ ios: "antenna.radiowaves.left.and.right", android: "wifi", web: "wifi" }}
            size={16}
            tintColor={theme.text}
          />
          <ThemedText type="smallBold" style={styles.sectionTitle}>ThingSpeak Channel</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">Channel ID</ThemedText>
        <ThemedText type="smallBold">{config.channelId}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
          Use the dashboard settings modal to edit polling, fields, and channel configuration.
        </ThemedText>
      </View>

      {/* Push Notifications Info & Test */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
            marginTop: Spacing.two,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <SymbolView
            name={{ ios: "bell.fill", android: "notifications", web: "notifications" }}
            size={16}
            tintColor={theme.text}
          />
          <ThemedText type="smallBold" style={styles.sectionTitle}>Push Notifications</ThemedText>
        </View>

        <View style={styles.infoGroup}>
          <ThemedText type="small" themeColor="textSecondary">Status</ThemedText>
          <ThemedText type="smallBold" style={{ textTransform: "capitalize" }}>
            {pushStatus}
          </ThemedText>
        </View>

        {pushError && (
          <View style={styles.infoGroup}>
            <ThemedText type="small" style={{ color: "#ff4d4f" }}>Error</ThemedText>
            <ThemedText type="small" style={{ color: "#ff4d4f" }}>{pushError}</ThemedText>
          </View>
        )}

        <View style={styles.infoGroup}>
          <ThemedText type="small" themeColor="textSecondary">Token</ThemedText>
          {expoPushToken ? (
            <View style={styles.tokenRow}>
              <ThemedText type="code" style={styles.tokenText} numberOfLines={1} ellipsizeMode="middle">
                {expoPushToken}
              </ThemedText>
              <Pressable
                onPress={handleCopyToken}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <SymbolView
                  name={{ ios: "doc.on.doc.fill", android: "content_copy", web: "content_copy" }}
                  size={14}
                  tintColor={theme.text}
                />
              </Pressable>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: "italic" }}>
              {Platform.OS === "web"
                ? "Not applicable on web (using native browser alerts)"
                : "No token available"}
            </ThemedText>
          )}
        </View>

        <Pressable
          onPress={handleSendTestNotification}
          disabled={testSending}
          style={({ pressed }) => [
            styles.testButton,
            { backgroundColor: "#1890ff" },
            testSending && { opacity: 0.7 },
            pressed && !testSending && { opacity: 0.8 },
          ]}
        >
          {testSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText type="smallBold" style={{ color: "#fff" }}>
              Send Test Notification
            </ThemedText>
          )}
        </Pressable>

        {testStatus && (
          <View
            style={[
              styles.testResultBox,
              {
                backgroundColor: testStatus.success ? "rgba(82, 196, 26, 0.1)" : "rgba(255, 77, 79, 0.1)",
                borderColor: testStatus.success ? "#52c41a" : "#ff4d4f",
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: testStatus.success ? "#52c41a" : "#ff4d4f",
                textAlign: "center",
              }}
            >
              {testStatus.message}
            </ThemedText>
          </View>
        )}
      </View>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
  },
  themeOptionsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  themeOption: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: "center",
    gap: Spacing.one,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  infoGroup: {
    gap: 2,
    marginTop: Spacing.one,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
  },
  copyButton: {
    padding: Spacing.one,
  },
  testButton: {
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  testResultBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
});
