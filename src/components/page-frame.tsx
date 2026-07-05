import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { NavigationHeader } from "@/components/navigation-header";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type PageFrameProps = {
  title: string;
  subtitle?: string;
  /** @deprecated icon is no longer rendered in PageFrame — kept for backward compat */
  icon?: {
    ios: string;
    android: string;
    web: string;
  };
  children: React.ReactNode;
};

export function PageFrame({ title, subtitle, children }: PageFrameProps) {
  const scheme = useColorScheme();
  const theme = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Menu bar — same as dashboard */}
          <NavigationHeader title={title} subtitle={subtitle} />

          {/* Page content */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}
          >
            {children}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // On web, make sure the safe area covers the full viewport height
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh" } as any)
      : {}),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    gap: Spacing.five,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.four,
  },
});
