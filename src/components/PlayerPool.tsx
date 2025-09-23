import { useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { CameraCapture } from './CameraCapture'

export function PlayerPool() {
  const players = useQuery(api.players.list) || []
  const createPlayer = useMutation(api.players.create)
  const generateUploadUrl = useMutation(api.players.generateUploadUrl)
  const updatePlayerImage = useMutation(api.players.updatePlayerImage)
  const removePlayerImage = useMutation(api.players.removePlayerImage)

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <div key={player._id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center space-x-3">
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
                <h3 className="text-foreground font-semibold">{player.name}</h3>
              </div>

              {/* Image upload controls */}
              <div className="mb-3 flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(player._id, e)}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPlayerId === player._id}
                  className="flex-1"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  Upload
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCamera(player._id)}
                  disabled={uploadingPlayerId === player._id}
                  className="flex-1"
                >
                  <Camera className="mr-1 h-3 w-3" />
                  Camera
                </Button>

                {player.imageStorageId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage(player._id)}
                    disabled={uploadingPlayerId === player._id}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="text-foreground/70 space-y-1 text-sm">
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
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No players added yet. Add your first player above!
          </div>
        )}
      </div>
    </div>
  )
}
