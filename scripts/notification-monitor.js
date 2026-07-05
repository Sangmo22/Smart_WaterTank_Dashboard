const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  THINGSPEAK_CHANNEL_ID: "3420273",
  THINGSPEAK_READ_API_KEY: "WZV2KJC22K3ZDNGM",
  SOURCE_FIELD: "1",
  SOURCE_MIN_RAW: "0",
  SOURCE_MAX_RAW: "100",
  SOURCE_INVERT: "false",
  SOURCE_ALERT_THRESHOLD: "8",
  POLL_INTERVAL_MS: "15000",
  ALERT_REMINDER_MS: "1800000",
};

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"|"$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getConfig() {
  loadEnvFile();

  const env = { ...DEFAULTS, ...process.env };
  return {
    expoPushToken: env.EXPO_PUSH_TOKEN,
    channelId: env.THINGSPEAK_CHANNEL_ID,
    readApiKey: env.THINGSPEAK_READ_API_KEY,
    sourceField: Number(env.SOURCE_FIELD),
    sourceMinRaw: Number(env.SOURCE_MIN_RAW),
    sourceMaxRaw: Number(env.SOURCE_MAX_RAW),
    sourceInvert: env.SOURCE_INVERT === "true",
    threshold: Number(env.SOURCE_ALERT_THRESHOLD),
    pollIntervalMs: Number(env.POLL_INTERVAL_MS),
    reminderMs: Number(env.ALERT_REMINDER_MS),
  };
}

function scaleValue(value, min, max, invert) {
  if (min === max) return 0;

  let percentage = ((value - min) / (max - min)) * 100;
  if (invert) {
    percentage = 100 - percentage;
  }

  return Math.max(0, Math.min(100, Math.round(percentage)));
}

async function fetchSourceLevel(config) {
  const url = new URL(
    `https://api.thingspeak.com/channels/${config.channelId}/feeds.json`,
  );
  url.searchParams.set("results", "1");
  if (config.readApiKey) {
    url.searchParams.set("api_key", config.readApiKey);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ThingSpeak error: ${response.status}`);
  }

  const payload = await response.json();
  const feed = payload.feeds?.[0];
  if (!feed) {
    throw new Error("ThingSpeak returned no feed data.");
  }

  const raw = Number(feed[`field${config.sourceField}`] ?? 0);
  const level = scaleValue(
    raw,
    config.sourceMinRaw,
    config.sourceMaxRaw,
    config.sourceInvert,
  );

  return {
    raw,
    level,
    updatedAt: feed.created_at,
  };
}

async function sendExpoPush(config, source) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: config.expoPushToken,
      sound: true,
      title: "Source tank critically low",
      body: `Source tank is at ${source.level}%. Refill before the pump runs dry.`,
      data: {
        type: "source-low",
        sourceLevel: source.level,
        sourceRaw: source.raw,
        updatedAt: source.updatedAt,
      },
      channelId: "water-alerts",
      priority: "high",
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.data?.status === "error") {
    throw new Error(
      payload.data?.message || `Expo push error: ${response.status}`,
    );
  }
}

async function main() {
  const config = getConfig();

  if (!config.expoPushToken) {
    throw new Error(
      "Missing EXPO_PUSH_TOKEN. Add it to .env.local after opening the native app on your phone.",
    );
  }

  let wasCritical = false;
  let lastSentAt = 0;

  console.log(
    `Monitoring ThingSpeak channel ${config.channelId}, field ${config.sourceField}, threshold < ${config.threshold}%`,
  );

  async function tick() {
    try {
      const source = await fetchSourceLevel(config);
      const isCritical = source.level < config.threshold;
      const now = Date.now();
      const shouldSend =
        isCritical &&
        (!wasCritical || now - lastSentAt >= config.reminderMs);

      console.log(
        `[${new Date().toLocaleString()}] Source ${source.level}% (${source.raw} raw)`,
      );

      if (shouldSend) {
        await sendExpoPush(config, source);
        lastSentAt = now;
        console.log("Push notification sent.");
      }

      wasCritical = isCritical;
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }

  await tick();
  setInterval(tick, config.pollIntervalMs);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
