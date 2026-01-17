// Layout components - centralized exports
export { AppShell, DesktopShell, useBrowser } from "./AppShell";
export { MobileShell } from "./MobileShell";
export { MobileTabSwitcher } from "./MobileTabSwitcher";
export { ResponsiveShell } from "./ResponsiveShell";
export { ToolContent, ArtifactRunner, TabItem } from "./shared-components";
export {
  BrowserProvider,
  tools,
  getToolById,
  type Tab,
  type BrowserContextType,
  type ToolDefinition,
} from "./browser-context";
