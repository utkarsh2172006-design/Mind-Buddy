/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai"; // ✅ Correct import
import { Send, Sparkles, Heart, Loader2, Copy, Check, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

// System instruction for MindBuddy
const SYSTEM_INSTRUCTION = `You are MindBuddy, a friendly, empathetic, and supportive mental health assistant. 
Your purpose is to help users cope with stress, anxiety, sadness, and other emotional struggles by giving helpful advice, short exercises, and motivational support. 
You always respond in a kind, calm, and conversational tone, like a caring friend. 

Core Behavior:
1. Empathetic, Friendly Tone: Always kind, calm, and supportive. Use sentiment analysis to match the user's mood. Avoid nagging or repetitive encouragement.
2. Natural Response Flow: When providing guidance or analysis, weave these elements into a single, cohesive, and natural reply WITHOUT using explicit headings like "Breakdown" or "Analysis":
   - Empathize: Start by acknowledging and validating the user's feeling.
   - Describe: Describe the situation or the "stuckness" clearly without labeling it.
   - Explain Why: Explain why it's happening naturally, drawing from psychological or self-improvement knowledge.
   - Give Insight: Provide a helpful reasoning or perspective.
   - Give Action: Offer a clear, actionable instruction or "self-care prescription."
   - Optional Reset: End with a small supportive suggestion or mental reset tip if it fits.
3. Optional Follow-Ups: Only suggest follow-ups like "Do you want another tip?" if it makes sense in the context; don't force them.
4. Short & Simple Responses: Keep replies concise and readable (under 150 words to allow for the flow). No long paragraphs.
5. User-Driven Interaction: Let the user decide the pace of conversation; respond only when they type.
6. No Over-Repetition: Don't repeat tips or motivational messages unnecessarily.
7. Context-Aware Tips: Suggest exercises or advice relevant to user input, not generic pushy messages.
8. Polite Decline: If the user says "I don't want advice," respond politely: "That’s okay 🙂. I’m here if you change your mind."
9. Avoid Over-Engagement: Don't prompt multiple questions in a row; only one suggestion at a time.
10. Supportive Closure: End conversations gracefully if the user seems to be finishing: "I’m here whenever you want to chat 💛."
11. Non-Intrusive Personality: Never act "clingy" by continuously checking mood or pushing repeated exercises.
12. Crisis Handling: High-risk phrases should trigger immediate gentle guidance to professional help, but nothing else.
13. Empower the User: Encourage action but let the user choose what to do and when.

Safety Disclaimer: Never give medical advice or claim to be a professional therapist.
Optional fun touch: Use soft emojis like 🙂, 🌸, 💛 to make it friendly but not too casual.`;

interface Message {
  role: "user" | "model";
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I'm MindBuddy, your friendly companion. How are you feeling today? 🌸",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (textToSubmit?: string) => {
    const text = textToSubmit || input;
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // ✅ Use env variable here, never hardcode API key
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_API_KEY
      });

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      const response = await chat.sendMessage({ message: text });
      const modelText = response.text || "I'm here for you. Could you tell me more? 💛";
      
      setMessages((prev) => [...prev, { role: "model", text: modelText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I'm sorry, I'm having a little trouble connecting right now. But I'm still here for you! Take a deep breath. 💛",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickExercises = [
    { icon: <Sparkles className="w-4 h-4" />, label: "Understand Me", prompt: "Can you help me understand what I'm going through and suggest a small self-care step?" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Journaling", prompt: "Give me a journaling idea." },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#4a4a3a] font-serif flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl flex flex-col items-center mb-8 text-center"
      >
        <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Heart className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">MindBuddy</h1>
        <p className="text-[#7a7a6a] italic">Your gentle companion for emotional well-being</p>
      </motion.header>

      {/* Chat Container */}
      <main className="w-full max-w-2xl bg-white rounded-[32px] shadow-xl overflow-hidden flex flex-col h-[600px] border border-[#e5e5d5]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${
                    message.role === "user"
                      ? "bg-[#5A5A40] text-white rounded-tr-none"
                      : "bg-[#f0f0e8] text-[#4a4a3a] rounded-tl-none border border-[#e5e5d5]"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                  {message.role === "model" && (
                    <button
                      onClick={() => handleCopy(message.text, index)}
                      className="absolute bottom-2 right-2 p-1.5 bg-white/50 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-[#e5e5d5]"
                      title="Copy message"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#5A5A40]" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#f0f0e8] p-4 rounded-2xl rounded-tl-none border border-[#e5e5d5] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#5A5A40]" />
                <span className="text-sm italic">MindBuddy is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-[#f0f0e8] bg-[#fafafa]">
          {quickExercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleSend(ex.prompt)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e5d5] rounded-full text-xs hover:bg-[#f5f5f0] transition-colors whitespace-nowrap"
            >
              {ex.icon}
              {ex.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-[#f0f0e8]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling?"
              className="flex-1 px-4 py-3 bg-[#f5f5f0] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4a4a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer Quote */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center max-w-md"
      >
        <p className="text-sm italic text-[#7a7a6a]">
          "Self-care is how you take your power back."
        </p>
      </motion.footer>
    </div>
  );
}
