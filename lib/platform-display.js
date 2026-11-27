// The server supplies nodePlatform. A remote panel must not use the browser OS.
export function platformDisplay(nodePlatform, configuredMode) {
  if (configuredMode === "windows" || configuredMode === "linux") return configuredMode;
  if (nodePlatform === "win32") return "windows";
  if (nodePlatform === "darwin") return "macos";
  return nodePlatform || "unknown";
}

export function platformLabel(platform) {
  switch (platform) {
    case "macos": return "macOS";
    case "windows": return "Windows";
    case "linux": return "Linux";
    case "unknown": return "未知平台";
    default: return platform;
  }
}
