"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";

type Message = {
  id: string;
  content: string;
  player_name: string;
  created_at: string;
  room_id: string;
};

export function RoomChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const fetchMessages = async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
    scrollToBottom();
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Setup realtime subscription
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Received realtime message:", payload);
          setMessages((current) => [...current, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (!message.trim() || !roomId) return;

    const { error } = await supabase.from("messages").insert([
      {
        content: message.trim(),
        room_id: roomId,
        player_name: "Anonymous",
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    setMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">Room Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="text-sm font-medium">{msg.player_name}</div>
            <div className="bg-secondary p-2 rounded-md">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
}
