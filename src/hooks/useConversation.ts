import { useState, useCallback, useRef, useEffect } from "react";
import {
  ConversationState,
  Message,
  ConversationData,
  RECIPIENT_OPTIONS,
  OCCASION_OPTIONS,
  BUDGET_OPTIONS,
  INTEREST_OPTIONS,
} from "../types/conversation";

export function useConversation() {
  const [state, setState] = useState<ConversationState>("GREET");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((role: "bot" | "user", content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const addBotMessage = useCallback(
    (content: string, delay: number = 800) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage("bot", content);
      }, delay);
    },
    [addMessage]
  );

  const handleRecipientSelect = useCallback(
    (value: string) => {
      const selected = RECIPIENT_OPTIONS.find((opt) => opt.value === value);
      if (!selected) return;

      addMessage("user", selected.label);
      setConversationData((prev) => ({ ...prev, recipient: value }));
      setState("OCCASION");
      addBotMessage(`Great choice! What's the occasion?`);
    },
    [addMessage, addBotMessage]
  );

  const handleOccasionSelect = useCallback(
    (value: string) => {
      const selected = OCCASION_OPTIONS.find((opt) => opt.value === value);
      if (!selected) return;

      addMessage("user", selected.label);
      setConversationData((prev) => ({ ...prev, occasion: value }));
      setState("BUDGET");
      addBotMessage(`Perfect! What's your budget?`);
    },
    [addMessage, addBotMessage]
  );

  const handleBudgetSelect = useCallback(
    (value: string) => {
      const selected = BUDGET_OPTIONS.find((opt) => opt.value === value);
      if (!selected) return;

      addMessage("user", selected.label);
      setConversationData((prev) => ({ ...prev, budget: value }));
      setState("INTERESTS");
      addBotMessage(`Got it! What are they interested in? (Select all that apply)`);
    },
    [addMessage, addBotMessage]
  );

  const handleInterestsSelect = useCallback(
    (value: string) => {
      setConversationData((prev) => {
        const currentInterests = prev.interests || [];
        const newInterests = currentInterests.includes(value)
          ? currentInterests.filter((i) => i !== value)
          : [...currentInterests, value];
        return { ...prev, interests: newInterests };
      });
    },
    []
  );

  const handleInterestsConfirm = useCallback(() => {
    const selectedLabels = conversationData.interests
      ?.map((value) => INTEREST_OPTIONS.find((opt) => opt.value === value)?.label)
      .filter(Boolean)
      .join(", ");

    if (selectedLabels) {
      addMessage("user", selectedLabels);
    }

    setState("LOADING");
    addBotMessage(`Excellent! Let me find the perfect gifts for you...`, 500);
  }, [conversationData.interests, addMessage, addBotMessage]);

  const startConversation = useCallback(() => {
    setState("RECIPIENT");
    addBotMessage(`Hi! I'm here to help you find the perfect gift. Who are you buying for?`, 500);
  }, [addBotMessage]);

  const resetConversation = useCallback(() => {
    setState("GREET");
    setMessages([]);
    setConversationData({});
    setIsTyping(false);
  }, []);

  const getCurrentStep = useCallback((): number => {
    const stepMap: Record<ConversationState, number> = {
      GREET: 0,
      RECIPIENT: 0,
      OCCASION: 1,
      BUDGET: 2,
      INTERESTS: 3,
      LOADING: 4,
      RESULTS: 4,
    };
    return stepMap[state];
  }, [state]);

  return {
    state,
    setState,
    messages,
    conversationData,
    isTyping,
    messagesEndRef,
    handleRecipientSelect,
    handleOccasionSelect,
    handleBudgetSelect,
    handleInterestsSelect,
    handleInterestsConfirm,
    startConversation,
    resetConversation,
    getCurrentStep,
  };
}
