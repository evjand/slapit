import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface LeagueSetupProps {
  onLeagueCreated: (leagueId: Id<"leagues">) => void;
}

export function LeagueSetup({ onLeagueCreated }: LeagueSetupProps) {
  const players = useQuery(api.players.list) || [];
  const leagues = useQuery(api.leagues.list) || [];
  const createLeague = useMutation(api.leagues.create);

  const [leagueName, setLeagueName] = useState("");
  const [playersPerHeat, setPlayersPerHeat] = useState(4);
  const [setsPerHeat, setSetsPerHeat] = useState(3);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<"players">[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handlePlayerToggle = (playerId: Id<"players">) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim() || selectedPlayerIds.length < 2) {
      toast.error("League name and at least 2 players are required");
      return;
    }

    setIsCreating(true);
    try {
      const leagueId = await createLeague({
        name: leagueName.trim(),
        playersPerHeat,
        setsPerHeat,
        playerIds: selectedPlayerIds,
      });
      
      toast.success("League created successfully!");
      onLeagueCreated(leagueId);
    } catch (error) {
      toast.error("Failed to create league");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New League */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New League</h2>
        
        <form onSubmit={handleCreateLeague} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              League Name
            </label>
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="Enter league name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Players per Heat
              </label>
              <input
                type="number"
                min="2"
                max="8"
                value={playersPerHeat}
                onChange={(e) => setPlayersPerHeat(parseInt(e.target.value) || 2)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sets per Heat
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={setsPerHeat}
                onChange={(e) => setSetsPerHeat(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Players ({selectedPlayerIds.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {players.map((player) => (
                <label
                  key={player._id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(player._id)}
                    onChange={() => handlePlayerToggle(player._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                  <span className="text-sm">{player.name}</span>
                </label>
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No players available. Add players in the Player Pool first.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating || !leagueName.trim() || selectedPlayerIds.length < 2}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCreating ? "Creating League..." : "Create League"}
          </button>
        </form>
      </div>

      {/* Existing Leagues */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Leagues</h2>
        
        <div className="space-y-3">
          {leagues.slice(0, 5).map((league) => (
            <div
              key={league._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <h3 className="font-medium text-gray-900">{league.name}</h3>
                <p className="text-sm text-gray-600">
                  {league.playersPerHeat} players per heat • {league.setsPerHeat} sets per heat • Status: {league.status}
                </p>
              </div>
              <button
                onClick={() => onLeagueCreated(league._id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {league.status === "setup" ? "Manage" : "View"}
              </button>
            </div>
          ))}
        </div>

        {leagues.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leagues created yet. Create your first league above!
          </div>
        )}
      </div>
    </div>
  );
}
