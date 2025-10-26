export type ConversationState =
  | "GREET"
  | "RECIPIENT"
  | "OCCASION"
  | "BUDGET"
  | "INTERESTS"
  | "LOADING"
  | "RESULTS";

export type MessageRole = "bot" | "user";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ConversationData {
  recipient?: string;
  occasion?: string;
  budget?: string;
  interests?: string[];
}

export interface QuickReply {
  label: string;
  value: string;
}

export const RECIPIENT_OPTIONS: QuickReply[] = [
  { label: "Partner", value: "partner" },
  { label: "Parent", value: "parent" },
  { label: "Friend", value: "friend" },
  { label: "Colleague", value: "colleague" },
  { label: "Child", value: "child" },
  { label: "Sibling", value: "sibling" },
];

export const OCCASION_OPTIONS: QuickReply[] = [
  { label: "Birthday", value: "birthday" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Christmas", value: "christmas" },
  { label: "Valentine's Day", value: "valentines" },
  { label: "Thank You", value: "thank_you" },
  { label: "Just Because", value: "just_because" },
];

export const BUDGET_OPTIONS: QuickReply[] = [
  { label: "Under £20", value: "under_20" },
  { label: "£20-50", value: "20_50" },
  { label: "£50-100", value: "50_100" },
  { label: "£100-200", value: "100_200" },
  { label: "£200+", value: "200_plus" },
];

export const INTEREST_OPTIONS: QuickReply[] = [
  { label: "Sports & Fitness", value: "sports" },
  { label: "Technology", value: "tech" },
  { label: "Fashion & Beauty", value: "fashion" },
  { label: "Books & Reading", value: "books" },
  { label: "Food & Cooking", value: "food" },
  { label: "Travel & Adventure", value: "travel" },
  { label: "Gaming", value: "gaming" },
  { label: "Music & Arts", value: "music" },
  { label: "Home & Garden", value: "home" },
  { label: "Wellness & Self-Care", value: "wellness" },
];
