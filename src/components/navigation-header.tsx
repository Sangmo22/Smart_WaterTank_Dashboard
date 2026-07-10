import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter, usePathname } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/state/auth-context";

const menuItems = [
  { key: "dashboard", label: "Dashboard", route: "/" },
  { key: "analytics", label: "Analytics", route: "/analytics" },
  { key: "pump", label: "Pump Settings", route: "/pump-settings" },
  { key: "alerts", label: "Alerts", route: "/alerts" },
  { key: "settings", label: "Settings", route: "/settings" },
] as const;

const menuIcons = {
  dashboard: {
    ios: "square.grid.2x2.fill",
    android: "dashboard",
    web: "dashboard",
  },
  analytics: { ios: "chart.bar.fill", android: "insights", web: "insights" },
  pump: { ios: "wrench.and.screwdriver.fill", android: "tune", web: "tune" },
  alerts: {
    ios: "bell.fill",
    android: "notifications",
    web: "notifications",
  },
  settings: { ios: "gearshape.fill", android: "settings", web: "settings" },
} as const;

type Props = {
  title: string;
  subtitle?: string;
};

export function NavigationHeader({ title, subtitle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const scheme = useColorScheme();
  const theme = Colors[scheme === "dark" ? "dark" : "light"];
  const [menuVisible, setMenuVisible] = useState(false);

  // Derive the active menu key from the current route
  const activeKey = (() => {
    if (pathname === "/" || pathname === "/index") return "dashboard";
    if (pathname === "/analytics") return "analytics";
    if (pathname === "/pump-settings") return "pump";
    if (pathname === "/alerts") return "alerts";
    if (pathname === "/settings") return "settings";
    return "dashboard";
  })();

  return (
    <>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          {/* Hamburger menu button */}
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [
              styles.menuBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <SymbolView
              name={{
                ios: "line.3.horizontal",
                android: "menu",
                web: "menu",
              }}
              size={24}
              tintColor={theme.text}
            />
          </Pressable>

          <View>
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      {/* Slide-out drawer modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={[styles.drawerPanel, { backgroundColor: theme.background }]}
            onPress={() => undefined}
          >
            <View style={styles.drawerHeader}>
              <ThemedText type="subtitle" style={styles.drawerTitle}>
                Menu
              </ThemedText>
              <Pressable
                onPress={() => setMenuVisible(false)}
                style={styles.drawerCloseButton}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  size={20}
                  tintColor={theme.text}
                />
              </Pressable>
            </View>

            <View style={styles.drawerList}>
              {menuItems.map((item) => {
                const selected = activeKey === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setMenuVisible(false);
                      if (item.route === "/") {
                        router.replace("/");
                      } else {
                        router.replace(item.route);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.drawerItem,
                      {
                        backgroundColor: selected ? "#1d5cff" : "transparent",
                      },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <View style={styles.drawerItemIcon}>
                      <SymbolView
                        name={menuIcons[item.key]}
                        size={18}
                        tintColor={selected ? "#fff" : theme.textSecondary}
                      />
                    </View>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: selected ? "#fff" : theme.text,
                        fontSize: 16,
                      }}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  menuBtn: {
    padding: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    flexDirection: "row",
  },
  drawerPanel: {
    width: 290,
    minHeight: "100%",
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 6, height: 0 },
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.18)",
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  drawerCloseButton: {
    padding: Spacing.one,
  },
  drawerList: {
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  drawerItemIcon: {
    width: 24,
    alignItems: "center",
  },
});
