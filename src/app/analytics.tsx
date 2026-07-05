import React from "react";
import { View, StyleSheet } from "react-native";
import { PageFrame } from "@/components/page-frame";
import { ThemedText } from "@/components/themed-text";
import { useThingSpeak } from "@/hooks/use-thingspeak";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AnalyticsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === "dark" ? "dark" : "light"];
  const { data, config } = useThingSpeak();

  return (
    <PageFrame
      title="Analytics"
      subtitle="Trend view for tank levels"
      icon={{ ios: "chart.bar.fill", android: "insights", web: "insights" }}
    >
      <ThemedText type="small" themeColor="textSecondary">
        This page gives you a dedicated view for the same live ThingSpeak feed
        used by the dashboard.
      </ThemedText>
      <View
        style={[
          styles.stats,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}
      >
        <ThemedText type="smallBold">Channel {config.channelId}</ThemedText>
        <ThemedText type="small">Source: {data.sourceLevel}%</ThemedText>
        <ThemedText type="small">Overhead: {data.overheadLevel}%</ThemedText>
      </View>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  stats: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
