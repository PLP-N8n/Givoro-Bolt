import { MessageRole } from "../types/conversation";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isBot = role === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isBot
            ? "bg-white border border-gray-200 text-gray-900"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        }`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
