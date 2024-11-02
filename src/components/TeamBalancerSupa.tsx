"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Pencil } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { RoomChat } from "@/components/RoomChat";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

type Player = {
  id: string;
  name: string;
  skill: number;
  room_id: string;
};

type TeamState = {
  id: string;
  room_id: string;
  team_data: Player[][];
};

export default function TeamBalancerSupa() {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [numTeams, setNumTeams] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Player[][]>([]);
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") || uuidv4();

  const fetchPlayers = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId);

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    setPlayers(data || []);
  }, [roomId, supabase]);

  const setupRealtimeSubscription = useCallback(() => {
    console.log("Setting up realtime for players in room:", roomId);

    const channel = supabase
      .channel(`players_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Player change received:", payload);

          switch (payload.eventType) {
            case "INSERT":
              setPlayers((current) => [...current, payload.new as Player]);
              break;
            case "DELETE":
              console.log("Removing player with id:", payload.old.id);
              setPlayers((current) =>
                current.filter((p) => p.id !== payload.old.id)
              );
              break;
            case "UPDATE":
              setPlayers((current) =>
                current.map((p) =>
                  p.id === payload.new.id ? (payload.new as Player) : p
                )
              );
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      channel.unsubscribe();
    };
  }, [roomId, supabase]);

  const setupTeamsSubscription = useCallback(() => {
    const channel = supabase
      .channel(`teams_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setTeamState(payload.new as TeamState);
            setTeams((payload.new as TeamState).team_data);
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [roomId, supabase]);

  useEffect(() => {
    if (!searchParams.get("room")) {
      router.push(`?room=${roomId}`);
    }

    fetchPlayers();
    const cleanup = setupRealtimeSubscription();

    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("*")
          .eq("room_id", roomId)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            // ignore "no rows returned" error
            console.error("Error fetching teams:", error);
          }
          return;
        }

        if (data) {
          setTeamState(data);
          setTeams(data.team_data || []);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };

    fetchTeams();
    const teamsCleanup = setupTeamsSubscription();

    return () => {
      cleanup();
      teamsCleanup();
    };
  }, [
    fetchPlayers,
    roomId,
    router,
    searchParams,
    setupRealtimeSubscription,
    setupTeamsSubscription,
    supabase,
  ]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) return;

    const newPlayer = {
      name: playerName,
      skill: 1,
      room_id: roomId,
    };

    const { error } = await supabase.from("players").insert([newPlayer]);

    if (error) {
      console.error("Error adding player:", error);
      return;
    }

    setShowNameDialog(false);
  };

  const removePlayer = async (playerId: string) => {
    console.log("Attempting to remove player:", playerId);

    const { data, error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId)
      .select(); // Add select to get the deleted row data

    if (error) {
      console.error("Error removing player:", error);
    } else {
      console.log("Successfully deleted player:", data);
    }
  };

  const updatePlayerSkill = async (playerId: string, skill: number) => {
    const { error } = await supabase
      .from("players")
      .update({ skill: Math.max(1, Math.min(5, skill)) })
      .eq("id", playerId);

    if (error) {
      console.error("Error updating player skill:", error);
    }
  };

  const balanceTeams = async () => {
    const sortedPlayers = [...players].sort((a, b) => b.skill - a.skill);
    const balancedTeams: Player[][] = Array.from(
      { length: numTeams },
      () => []
    );

    sortedPlayers.forEach((player, index) => {
      balancedTeams[index % numTeams].push(player);
    });

    if (teamState) {
      await supabase
        .from("teams")
        .update({ team_data: balancedTeams })
        .eq("id", teamState.id);
    } else {
      await supabase
        .from("teams")
        .insert([{ room_id: roomId, team_data: balancedTeams }]);
    }
  };

  const handleEditName = async () => {
    if (!editingPlayer || !playerName.trim()) return;

    const { error } = await supabase
      .from("players")
      .update({ name: playerName })
      .eq("id", editingPlayer.id);

    if (error) {
      console.error("Error updating player name:", error);
      return;
    }

    setEditingPlayer(null);
    setPlayerName("");
  };

  console.log({ players });

  return (
    <div className="h-screen flex flex-col w-full">
      <Dialog
        open={showNameDialog || !!editingPlayer}
        onOpenChange={(open) => {
          if (!open) {
            setShowNameDialog(false);
            setEditingPlayer(null);
            setPlayerName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Edit Player" : "Add Player"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (editingPlayer ? handleEditName() : handleJoinGame())
                }
                autoFocus
              />
            </div>
            <Button
              onClick={editingPlayer ? handleEditName : handleJoinGame}
              disabled={!playerName.trim()}
            >
              {editingPlayer ? "Save Changes" : "Add Player"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-end p-4 border-b border-border bg-card w-full">
        <Image
          src="/images/logo.webp"
          alt="Logo"
          width={124}
          height={124}
          className="mr-2"
          priority
        />
        <h1 className="text-xl font-semibold">LAN Paati Teamu Balancu desu</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="numTeams">Number of Teams</Label>
                  <Input
                    id="numTeams"
                    type="number"
                    value={numTeams}
                    onChange={(e) =>
                      setNumTeams(Math.max(2, parseInt(e.target.value) || 2))
                    }
                    min={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={balanceTeams}
                    disabled={players.length < numTeams}
                  >
                    Balance Teams
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNameDialog(true)}
                  >
                    Add Player
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Players ({players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 hover:bg-secondary rounded-md"
                    >
                      <span>{player.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPlayer(player);
                            setPlayerName(player.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={player.skill}
                          onChange={(e) =>
                            updatePlayerSkill(
                              player.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20"
                          min={1}
                          max={5}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayer(player.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Balanced Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-secondary"
                    >
                      <h3 className="font-bold mb-2">Team {index + 1}</h3>
                      <ul className="space-y-1">
                        {team.map((player) => (
                          <li key={player.id} className="flex justify-between">
                            <span>{player.name}</span>
                            <span className="text-muted-foreground">
                              Skill: {player.skill}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <RoomChat />
      </div>
    </div>
  );
}
