import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/components/fleet/desk";
import { LiveDesk } from "@/components/fleet/live";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [mode, setMode] = useState<"live" | "paper">("live");
  if (mode === "paper") return <Desk onLive={() => setMode("live")} />;
  return <LiveDesk onPaper={() => setMode("paper")} />;
}
