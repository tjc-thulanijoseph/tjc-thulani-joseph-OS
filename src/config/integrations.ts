/**
 * Integration registry — architecture only, no implementations.
 * Each entry becomes an adapter under src/services/providers when enabled.
 */
export type IntegrationCategory = "ai" | "social" | "music" | "messaging" | "commerce";

export interface IntegrationDefinition {
  key: string;
  label: string;
  category: IntegrationCategory;
  /** Env var names the adapter will read. Values live in secrets, never in code. */
  envKeys: string[];
  enabled: boolean;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  { key: "openai", label: "OpenAI", category: "ai", envKeys: ["OPENAI_API_KEY"], enabled: false },
  { key: "gemini", label: "Google Gemini", category: "ai", envKeys: ["GEMINI_API_KEY"], enabled: false },
  { key: "claude", label: "Anthropic Claude", category: "ai", envKeys: ["ANTHROPIC_API_KEY"], enabled: false },
  { key: "openrouter", label: "OpenRouter", category: "ai", envKeys: ["OPENROUTER_API_KEY"], enabled: false },
  { key: "youtube", label: "YouTube", category: "social", envKeys: ["YOUTUBE_API_KEY"], enabled: false },
  { key: "facebook", label: "Facebook", category: "social", envKeys: ["FACEBOOK_APP_ID"], enabled: false },
  { key: "instagram", label: "Instagram", category: "social", envKeys: ["INSTAGRAM_APP_ID"], enabled: false },
  { key: "tiktok", label: "TikTok", category: "social", envKeys: ["TIKTOK_CLIENT_KEY"], enabled: false },
  { key: "linkedin", label: "LinkedIn", category: "social", envKeys: ["LINKEDIN_CLIENT_ID"], enabled: false },
  { key: "spotify", label: "Spotify", category: "music", envKeys: ["SPOTIFY_CLIENT_ID"], enabled: false },
  { key: "apple-music", label: "Apple Music", category: "music", envKeys: ["APPLE_MUSIC_TOKEN"], enabled: false },
  { key: "email", label: "Transactional email", category: "messaging", envKeys: ["EMAIL_API_KEY"], enabled: false },
  { key: "push", label: "Push notifications", category: "messaging", envKeys: ["PUSH_PUBLIC_KEY"], enabled: false },
  { key: "payments", label: "Payments", category: "commerce", envKeys: ["PAYMENTS_API_KEY"], enabled: false },
];
