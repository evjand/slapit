import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { HeatView } from "./HeatView";

interface LeagueViewProps {
  leagueId: Id<"leagues">;
}

export function LeagueView({ leagueId }: LeagueViewProps) {
  const league = useQuery(api.leagues.get, { leagueId });
  const heats = useQuery(api.leagues.getHeats, { leagueId });
  const leagueTable = useQuery(api.leagues.getLeagueTable, { leagueId });
  const generateHeats = useMutation(api.leagues.generateHeats);
  
  const [selectedHeatId, setSelectedHeatId] = useState<Id<"heats"> | null>(null);
  const [activeTab, setActiveTab] = useState<"heats" | "table">("heats");

  const handleGenerateHeats = async () => {
    try {
      await generateHeats({ leagueId });
      toast.success("New heats generated!");
    } catch (error) {
      toast.error("Failed to generate heats");
    }
  };

  if (!league) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedHeatId) {
    return (
      <HeatView 
        heatId={selectedHeatId} 
        onBack={() => setSelectedHeatId(null)}
      />
    );
  }

  const allHeatsCompleted = heats?.every(heat => heat.status === "completed") ?? false;
  const hasActiveHeats = heats?.some(heat => heat.status !== "pending") ?? false;

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {league.playersPerHeat} players per heat • {league.setsPerHeat} sets per heat
            </p>
            <p className="text-sm text-gray-600">
              Round {league.currentRound} • Status: {league.status}
            </p>
          </div>
        </div>

        {league.status === "setup" && (
          <button
            onClick={handleGenerateHeats}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Generate First Round Heats
          </button>
        )}

        {league.status === "active" && allHeatsCompleted && (
          <button
            onClick={handleGenerateHeats}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Generate Next Round Heats
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("heats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "heats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Current Heats
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "table"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              League Table
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "heats" && (
            <div>
              {heats && heats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heats.map((heat) => (
                    <div
                      key={heat._id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        heat.status === "completed"
                          ? "bg-green-50 border-green-200"
                          : heat.status === "active"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedHeatId(heat._id)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900">
                          Heat {heat.heatNumber}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            heat.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : heat.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {heat.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {heat.players?.map((player) => (
                          <div
                            key={player?._id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>{player?.name}</span>
                            <span className="text-gray-600">
                              {player?.totalPoints} pts
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          Sets: {heat.setsCompleted} / {league.setsPerHeat}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {league.status === "setup" 
                    ? "Generate heats to start the league"
                    : "No heats available for current round"
                  }
                </div>
              )}
            </div>
          )}

          {activeTab === "table" && (
            <div>
              {leagueTable && leagueTable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Eliminations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Games Played
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leagueTable.map((participant, index) => (
                        <tr key={participant._id} className={index < 3 ? "bg-yellow-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <span className="mr-2">#{index + 1}</span>
                              {index === 0 && <span className="text-yellow-500">🥇</span>}
                              {index === 1 && <span className="text-gray-400">🥈</span>}
                              {index === 2 && <span className="text-yellow-600">🥉</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participant.player?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {participant.totalPoints}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participant.totalEliminations}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participant.gamesPlayed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No league data available yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
