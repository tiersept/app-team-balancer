import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMultiplayerState, myPlayer } from "playroomkit";

type ChatMessage = {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
};

export function RoomChat() {
  const [messages, setMessages] = useMultiplayerState<ChatMessage[]>(
    "messages",
    []
  );
  const [chatMessage, setChatMessage] = useState("");

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const player = myPlayer();
    if (!player) return;

    setMessages([
      ...messages,
      {
        playerId: player.id,
        playerName: player.getState("name") || "Unknown player",
        message: chatMessage.trim(),
        timestamp: Date.now(),
      },
    ]);
    setChatMessage("");
  };

  return (
    <div className="w-80 min-w-[640px] bg-secondary/50 border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">Room Chat</h2>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
        {messages.map((msg, i) => (
          <div
            key={msg.timestamp + i}
            className={`flex flex-col ${
              msg.playerId === myPlayer()?.id ? "items-end" : "items-start"
            }`}
          >
            <span className="text-xs text-muted-foreground">
              {msg.playerName}
            </span>
            <div
              className={`rounded-lg px-3 py-2 max-w-[80%] ${
                msg.playerId === myPlayer()?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
