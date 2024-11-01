"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  insertCoin,
  useMultiplayerState,
  useIsHost,
  myPlayer,
  usePlayersList,
  getRoomCode,
  usePlayersState,
} from "playroomkit";
import { X, Copy } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Player = {
  id: string;
  name: string;
  skill: number;
};

export default function TeamBalancer() {
  const [initialized, setInitialized] = useState(false);
  const [numTeams, setNumTeams] = useState(2);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [playerName, setPlayerName] = useState("");

  const isHost = useIsHost();
  const connectedPlayers = usePlayersList();
  const playersNames = usePlayersState("name");
  console.log({ playersNames });
  const [playerSkills, setPlayerSkills] = useMultiplayerState<
    Record<string, number>
  >("playerSkills", {});
  const [teams, setTeams] = useMultiplayerState<Player[][]>("teams", []);

  useEffect(() => {
    const init = async () => {
      if (!initialized) {
        await insertCoin({
          skipLobby: true,
        });
        setInitialized(true);
      }
    };
    init();
  }, [initialized]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) return;
    const player = myPlayer();
    if (player) {
      player.setState("name", playerName.trim());
      // setName(playerName.trim());
    }
    setShowNameDialog(false);
  };

  if (!initialized) {
    return <div>Loading...</div>;
  }

  const updatePlayerSkill = (playerId: string, skill: number) => {
    if (isHost) {
      setPlayerSkills({
        ...playerSkills,
        [playerId]: Math.max(1, Math.min(5, skill)),
      });
    }
  };

  const balanceTeams = () => {
    const players: Player[] = connectedPlayers.map((player) => ({
      id: player.id,
      name: player.getState("name") || `Player ${player.id}`,
      skill: playerSkills[player.id] || 1,
    }));

    const sortedPlayers = [...players].sort(
      (a, b) => (playerSkills[b.id] || 1) - (playerSkills[a.id] || 1)
    );

    const balancedTeams: Player[][] = Array.from(
      { length: numTeams },
      () => []
    );

    sortedPlayers.forEach((player, index) => {
      balancedTeams[index % numTeams].push(player);
    });

    setTeams(balancedTeams);
  };

  const roomCode = getRoomCode() || "...";

  const copyInviteLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}?r=${roomCode}`;
    navigator.clipboard.writeText(url);
  };

  const kickPlayer = (playerId: string) => {
    if (!isHost) return;
    const player = connectedPlayers.find((p) => p.id === playerId);
    if (player) {
      player.kick();
    }
  };

  return (
    <>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                autoFocus
              />
            </div>
            <Button onClick={handleJoinGame} disabled={!playerName.trim()}>
              Join Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="discord-layout">
        <div className="discord-header">
          <Image
            src="/images/logo.webp"
            alt="Logo"
            width={124}
            height={124}
            className="mr-2"
          />
          <h1 className="text-xl font-semibold">
            LAN Paati Teamu Balancu desu
            {isHost && (
              <span className="ml-2 text-sm text-primary">(Host)</span>
            )}
          </h1>
        </div>

        <div className="discord-content p-4 space-y-4">
          <Card className="discord-card">
            <CardContent className="p-4">
              {isHost && (
                <div className="grid w-full items-center gap-4 mb-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label
                      htmlFor="numTeams"
                      className="text-sm text-muted-foreground"
                    >
                      Number of Teams
                    </Label>
                    <Input
                      id="numTeams"
                      type="number"
                      value={numTeams}
                      onChange={(e) =>
                        setNumTeams(Math.max(2, parseInt(e.target.value)))
                      }
                      className="bg-secondary border-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Room Code:</span>
                <span className="font-mono">{roomCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInviteLink}
                  className="hover:bg-secondary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 text-sm">
                <span className="text-muted-foreground">
                  Connected Players:
                </span>
                <span className="ml-2">{connectedPlayers.length}</span>
              </div>
            </CardContent>
          </Card>

          {connectedPlayers.length > 0 && (
            <Card className="discord-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connectedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center space-x-2 py-2 px-2 hover:bg-secondary rounded-md"
                    >
                      <span className="w-1/3">
                        {player.getState("name") || `Player ${player?.id}`}
                      </span>
                      {isHost ? (
                        <>
                          <Input
                            type="number"
                            value={playerSkills[player.id] || 1}
                            onChange={(e) =>
                              updatePlayerSkill(
                                player.id,
                                parseInt(e.target.value)
                              )
                            }
                            min="1"
                            max="5"
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            Skill Level (1-5)
                          </span>
                          {player.id !== myPlayer()?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2 text-red-500 hover:text-red-700"
                              onClick={() => kickPlayer(player.id)}
                              title="Kick Player"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        playerSkills[player.id] && (
                          <span className="text-sm text-muted-foreground">
                            ⭐ Rated by host
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isHost && (
            <Button
              onClick={balanceTeams}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={connectedPlayers.length < numTeams}
            >
              Balance Teams
            </Button>
          )}

          {teams.length > 0 && (
            <Card className="discord-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  Balanced Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team, index) => (
                    <div key={index} className="border rounded p-2">
                      <h3 className="font-bold mb-2">Team {index + 1}</h3>
                      <ul>
                        {team.map((player) => (
                          <li key={player.id}>
                            {player.name} {isHost && `(Skill: ${player.skill})`}
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
      </div>
    </>
  );
}
