import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function PlayerPool() {
  const players = useQuery(api.players.list) || [];
  const createPlayer = useMutation(api.players.create);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setIsCreating(true);
    try {
      await createPlayer({ name: newPlayerName.trim() });
      setNewPlayerName("");
      toast.success("Player added successfully!");
    } catch (error) {
      toast.error("Failed to add player");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Pool</h2>
        
        <form onSubmit={handleCreatePlayer} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newPlayerName.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div
              key={player._id}
              className="bg-gray-50 rounded-lg p-4 border"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{player.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Games Won:</span>
                  <span className="font-medium">{player.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium">{player.totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eliminations:</span>
                  <span className="font-medium">{player.totalEliminations}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No players added yet. Add your first player above!
          </div>
        )}
      </div>
    </div>
  );
}
