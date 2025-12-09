import { WeddingKernel } from "./kernel-updates"; // Import WeddingKernel type from where it's now defined

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface UserProfile {
  usesEmojis: boolean;
  usesSwearing: boolean;
  messageLength: "short" | "medium" | "long";
  knowledgeLevel: "beginner" | "intermediate" | "experienced";
  communicationStyle: "casual" | "balanced" | "formal";
}

export function analyzeUserMessage(message: string, existingProfile: Partial<UserProfile> | null): Partial<UserProfile> {
  const updates: Partial<UserProfile> = {};
  
  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(message)) {
    updates.usesEmojis = true;
  }
  
  // Check for swearing (common mild swears)
  const swearRegex = /\b(damn|hell|shit|fuck|crap|ass|bullshit|dammit)\b/i;
  if (swearRegex.test(message)) {
    updates.usesSwearing = true;
  }
  
  // Analyze message length
  const wordCount = message.split(/\s+/).length;
  if (wordCount < 10) {
    updates.messageLength = "short";
  } else if (wordCount > 50) {
    updates.messageLength = "long";
  } else {
    updates.messageLength = "medium";
  }
  
  // If we already have a profile, only update if we're seeing new signals
  // (e.g., first emoji usage should flip the flag, but don't flip it back)
  if (existingProfile) {
    if (existingProfile.usesEmojis) delete updates.usesEmojis;
    if (existingProfile.usesSwearing) delete updates.usesSwearing;
    // Message length can update based on recent behavior
  }
  
  return updates;
}

export function buildUserProfileFromKernel(kernel: WeddingKernel): UserProfile {
  return {
    usesEmojis: kernel.usesEmojis || false,
    usesSwearing: kernel.usesSwearing || false,
    messageLength: kernel.messageLength || "medium",
    knowledgeLevel: kernel.knowledgeLevel || "intermediate",
    communicationStyle: (kernel.communicationStyle as "casual" | "balanced" | "formal") || "balanced",
  };
}
