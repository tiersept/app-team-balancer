import { Copy } from "lucide-react";
import { Button } from "./ui/button";

export const CopyInviteLink = () => {
  const copyInviteLink = () => {
    if (typeof window === "undefined") return;
  
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyInviteLink}
      className="hover:bg-secondary"
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
};
