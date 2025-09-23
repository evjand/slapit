import { useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardHeader, CardContent } from './ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'
import {
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  MoreHorizontal,
  MoreVertical,
} from 'lucide-react'
import { CameraCapture } from './CameraCapture'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function PlayerPool() {
  const players = useQuery(api.players.list) || []
  const createPlayer = useMutation(api.players.create)
  const generateUploadUrl = useMutation(api.players.generateUploadUrl)
  const updatePlayerImage = useMutation(api.players.updatePlayerImage)
  const removePlayerImage = useMutation(api.players.removePlayerImage)
  const deletePlayer = useMutation(api.players.deletePlayer)

  const [newPlayerName, setNewPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [uploadingPlayerId, setUploadingPlayerId] =
    useState<Id<'players'> | null>(null)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [cameraPlayerId, setCameraPlayerId] = useState<Id<'players'> | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    setIsCreating(true)
    try {
      await createPlayer({ name: newPlayerName.trim() })
      setNewPlayerName('')
      toast.success('Player added successfully!')
    } catch (error) {
      toast.error('Failed to add player')
    } finally {
      setIsCreating(false)
    }
  }

  const handleImageUpload = async (playerId: Id<'players'>, file: File) => {
    setUploadingPlayerId(playerId)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      const { storageId } = await result.json()

      // Update player with new image
      await updatePlayerImage({ playerId, imageStorageId: storageId })
      toast.success('Image uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploadingPlayerId(null)
    }
  }

  const handleFileSelect = (
    playerId: Id<'players'>,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(playerId, file)
    }
  }

  const handleOpenCamera = (playerId: Id<'players'>) => {
    setCameraPlayerId(playerId)
    setCameraModalOpen(true)
  }

  const handleCameraCapture = (file: File) => {
    if (cameraPlayerId) {
      handleImageUpload(cameraPlayerId, file)
    }
  }

  const handleCloseCamera = () => {
    setCameraModalOpen(false)
    setCameraPlayerId(null)
  }

  const handleRemoveImage = async (playerId: Id<'players'>) => {
    try {
      await removePlayerImage({ playerId })
      toast.success('Image removed successfully!')
    } catch (error) {
      toast.error('Failed to remove image')
    }
  }

  const handleDeletePlayer = async (playerId: Id<'players'>) => {
    try {
      await deletePlayer({ playerId })
      toast.success('Player deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete player')
    }
  }

  // Sort players by wins (descending) then total points (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.totalWins !== b.totalWins) {
      return b.totalWins - a.totalWins
    }
    return b.totalPoints - a.totalPoints
  })

  return (
    <div className="space-y-6">
      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraModalOpen}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
        playerName={players.find((p) => p._id === cameraPlayerId)?.name}
      />

      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-2xl font-bold">Player Pool</h2>

        <form onSubmit={handleCreatePlayer} className="mb-6">
          <div className="flex gap-3">
            <Input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              disabled={isCreating}
            />
            <Button
              type="submit"
              disabled={isCreating || !newPlayerName.trim()}
            >
              {isCreating ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sortedPlayers.map((player) => (
            <Card key={player._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <SimpleUserAvatar
                        userId={player._id}
                        size="md"
                        imageStorageId={player.imageStorageId}
                      />
                      {uploadingPlayerId === player._id && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-foreground text-lg font-semibold">
                      {player.name}
                    </h3>
                  </div>

                  {/* Player actions dropdown */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(player._id, e)}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={uploadingPlayerId === player._id}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPlayerId === player._id}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenCamera(player._id)}
                        disabled={uploadingPlayerId === player._id}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </DropdownMenuItem>
                      {player.imageStorageId && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveImage(player._id)}
                          disabled={uploadingPlayerId === player._id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove Image
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Player
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Player</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{player.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePlayer(player._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-foreground/70 space-y-2 text-xs">
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
                    <span className="font-medium">
                      {player.totalEliminations}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedPlayers.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No players added yet. Add your first player above!
          </div>
        )}
      </div>
    </div>
  )
}
