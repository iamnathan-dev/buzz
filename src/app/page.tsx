"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { Send } from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const queryClient = new QueryClient();

function ChatComponent() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const mutation = useMutation({
    mutationFn: async () => {
      const API_KEY = process.env.NEXT_PUBLIC_RAPID_API_KEY;
      const BASE_URL = process.env.NEXT_PUBLIC_RAPID_API_BASE_URL;
      const API_HOST = process.env.NEXT_PUBLIC_RAPID_API_HOST;

      if (!API_KEY || !BASE_URL) {
        throw new Error("API configuration is missing");
      }

      const { data } = await axios.post(
        `${BASE_URL}/gpt4`,
        {
          messages: messages.concat({ role: "user", content: input }),
          web_access: false,
        },
        {
          headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": API_HOST,
          },
        }
      );
      return data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.result },
      ]);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setIsLoading(true);

    mutation.mutate();
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 md:p-8 pb-20 gap-8 md:gap-16 lg:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-900">
      <main className="flex flex-col w-full max-w-3xl row-start-2 h-full">
        <div className="flex-1 overflow-hidden space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
              <div className="text-3xl md:text-4xl mb-2">👋</div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                Hello, I am Oversabi
              </h2>
              <p className="text-sm md:text-base text-gray-400 max-w-md px-2">
                There isn&apos;t anything in this world that I don&apos;t know,
                just ask me anything in the chatbox below, and I&apos;ll answer
                ASAP
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                <div
                  className={`rounded-lg p-2 md:p-3 max-w-[85%] md:max-w-[80%] overflow-hidden wrap-break-word ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm md:text-base">{message.content}</p>
                  ) : (
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </Markdown>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-gray-800 rounded-lg p-2 md:p-3 text-white">
                <p className="animate-pulse text-sm md:text-base">
                  Thinking...
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <form
        onSubmit={handleSubmit}
        className="flex items-start fixed bottom-0 md:max-w-3xl max-w-sm w-full md:w-full mb-3 md:mb-5 gap-3 md:gap-5 bg-gray-700 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
            }
          }}
          placeholder="Type your message..."
          className="p-3 md:p-5 !bg-transparent !shadow-none border-none focus:ring-0 focus:outline-none !text-sm md:!text-base !placeholder:text-gray-400 !text-white resize-none h-10 md:h-12 overflow-hidden"
        ></Textarea>
        <Button
          variant={"default"}
          size={"icon"}
          disabled={isLoading}
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
          }}
          className="cursor-pointer bg-gray-900 hover:bg-gray-800 h-10 w-10 md:h-12 md:w-12"
        >
          <Send strokeWidth={1} className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatComponent />
    </QueryClientProvider>
  );
}
