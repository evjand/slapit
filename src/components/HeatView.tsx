import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect } from "react";

interface HeatViewProps {
  heatId: Id<"heats">;
  onBack: () => void;
}

export function HeatView({ heatId, onBack }: HeatViewProps) {
  // First get the heat to find the league ID
  const heatData = useQuery(api.leagues.getHeat, { heatId });
  const currentSet = useQuery(api.heatSets.getCurrentSet, { heatId });
  const startNewSet = useMutation(api.heatSets.startNewSet);
  const eliminatePlayer = useMutation(api.heatSets.eliminatePlayer);
  const revertLastElimination = useMutation(api.heatSets.revertLastElimination);

  const specificHeat = heatData;

  // Auto-start next set when current set is completed
  useEffect(() => {
    if (currentSet?.status === "completed" && specificHeat?.status === "active") {
      // Check if we can start another set
      const canStartNewSet = specificHeat.setsCompleted < (specificHeat.league?.setsPerHeat || 0);
      
      if (canStartNewSet) {
        const timer = setTimeout(() => {
          handleStartNewSet();
        }, 2000); // 2 second delay to show the completion message

        return () => clearTimeout(timer);
      }
    }
  }, [currentSet?.status, specificHeat?.status, specificHeat?.setsCompleted]);

  const handleStartNewSet = async () => {
    try {
      await startNewSet({ heatId });
      toast.success("New set started!");
    } catch (error) {
      toast.error("Failed to start new set");
    }
  };

  const handleEliminatePlayer = async (playerId: Id<"players">) => {
    if (!currentSet) return;
    
    try {
      await eliminatePlayer({
        heatId,
        setId: currentSet._id,
        playerId,
      });
      toast.success("Player eliminated!");
    } catch (error) {
      toast.error("Failed to eliminate player");
    }
  };

  const handleRevertElimination = async () => {
    if (!currentSet) return;
    
    try {
      await revertLastElimination({ setId: currentSet._id });
      toast.success("Elimination reverted!");
    } catch (error) {
      toast.error("Failed to revert elimination");
    }
  };

  if (!specificHeat) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isHeatComplete = specificHeat.setsCompleted >= (specificHeat.league?.setsPerHeat || 0);
  const canStartNewSet = !isHeatComplete && (!currentSet || currentSet.status === "completed");

  return (
    <div className="space-y-6">
      {/* Heat Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to League
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Heat {specificHeat.heatNumber}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Sets: {specificHeat.setsCompleted} / {specificHeat.league?.setsPerHeat || 0}
            </p>
            <p className="text-sm text-gray-600">Status: {specificHeat.status}</p>
          </div>
        </div>

        {/* Heat Players */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specificHeat.players?.map((player) => (
            <div
              key={player?._id}
              className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200"
            >
              <h3 className="font-semibold text-gray-900">{player?.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {player?.totalPoints}
              </p>
              <p className="text-sm text-gray-600">
                {player?.totalEliminations} eliminations
              </p>
            </div>
          ))}
        </div>

        {/* Heat Complete Message */}
        {isHeatComplete && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center">
              🏆 Heat Complete! All {specificHeat.league?.setsPerHeat} sets have been played.
            </p>
          </div>
        )}
      </div>

      {/* Current Set */}
      {currentSet ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Set {currentSet.setNumber}
            </h2>
            <div className="flex space-x-3">
              {currentSet.eliminations.length > 0 && currentSet.status === "active" && (
                <button
                  onClick={handleRevertElimination}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Revert Last Elimination
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg text-gray-700 text-center">
              <span className="font-semibold">Server:</span>{" "}
              {currentSet.players?.find(p => p?._id === currentSet.serverId)?.name}
            </p>
          </div>

          {/* Horizontal Player Layout - Only show remaining players */}
          <div className="relative">
            {/* Playing field visualization */}
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-8 mb-6">
              <div className="flex justify-between items-center min-h-[120px]">
                {currentSet.players?.map((player, index) => {
                  if (!player?._id) return null;
                  const isServer = player._id === currentSet.serverId;
                  
                  return (
                    <div
                      key={player._id}
                      className={`flex flex-col items-center space-y-3 ${
                        currentSet.players && currentSet.players.length > 4 ? 'flex-1' : ''
                      }`}
                      style={{
                        minWidth: currentSet.players && currentSet.players.length > 4 ? 'auto' : '150px'
                      }}
                    >
                      {/* Player Card */}
                      <div
                        className={`p-4 rounded-lg border-2 transition-all w-full max-w-[150px] ${
                          isServer
                            ? "bg-green-200 border-green-500"
                            : "bg-white border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        <div className="text-center mb-2">
                          <div className="flex justify-center items-center mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {player.name}
                            </h3>
                            {isServer && (
                              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                S
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {player.totalPoints} pts
                          </p>
                        </div>

                        {currentSet.status === "active" && player._id && (
                          <button
                            onClick={() => handleEliminatePlayer(player._id!)}
                            className="w-full px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                          >
                            Eliminate
                          </button>
                        )}
                      </div>

                      {/* Position indicator */}
                      <div className="text-xs text-gray-500 font-medium">
                        Position {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {currentSet.status === "completed" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                🎉 Set Complete! Winner: {currentSet.players?.find(p => p?._id === currentSet.winner)?.name}
              </p>
              {canStartNewSet ? (
                <p className="text-green-700 text-sm text-center mt-1">
                  Starting next set automatically...
                </p>
              ) : (
                <p className="text-green-700 text-sm text-center mt-1">
                  Heat complete! All sets have been played.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          {canStartNewSet ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
              <p className="text-gray-600 mb-6">
                {specificHeat.players?.length} players ready to play
              </p>
              <button
                onClick={handleStartNewSet}
                disabled={!specificHeat.players || specificHeat.players.length < 2}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Start Set {specificHeat.setsCompleted + 1}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Heat Complete!</h2>
              <p className="text-gray-600 mb-6">
                All {specificHeat.league?.setsPerHeat} sets have been completed for this heat.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
