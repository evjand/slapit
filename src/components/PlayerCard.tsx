import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Player } from './PlayingField'
import { SimpleUserAvatar } from './UserAvatar'
import { Button } from './ui/button'
import { Camera, MoreVertical, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { Id } from '@convex/_generated/dataModel'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'

export function PlayerCard({ player }: { player: Player }) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadingPlayerId, setUploadingPlayerId] =
    useState<Id<'players'> | null>(null)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [cameraPlayerId, setCameraPlayerId] = useState<Id<'players'> | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateUploadUrl = useMutation(api.players.generateUploadUrl)
  const updatePlayerImage = useMutation(api.players.updatePlayerImage)
  const removePlayerImage = useMutation(api.players.removePlayerImage)
  const deletePlayer = useMutation(api.players.deletePlayer)

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-4">
            <SimpleUserAvatar
              userId={player._id!}
              size="sm"
              imageStorageId={player.imageStorageId}
            />
            {player.name}
          </div>
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={uploadingPlayerId === player._id}
                onClick={() => setIsOpen(true)}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPlayerId === player._id}
              >
                <Upload className="mr-2 size-4" />
                Upload Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenCamera(player._id!)}
                disabled={uploadingPlayerId === player._id}
              >
                <Camera className="mr-2 size-4" />
                Take Photo
              </DropdownMenuItem>
              {player.imageStorageId && (
                <DropdownMenuItem
                  onClick={() => handleRemoveImage(player._id!)}
                  disabled={uploadingPlayerId === player._id}
                >
                  <X className="mr-2 size-4" />
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
                    <Trash2 className="mr-2 size-4" />
                    Delete Player
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Player</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{player.name}"? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletePlayer(player._id!)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(player._id!, e)}
        />
        <CameraCapture
          isOpen={cameraModalOpen}
          onClose={handleCloseCamera}
          onCapture={handleCameraCapture}
          playerName={player.name}
        />

        <div className="text-foreground/70 space-y-2 text-xs">
          <div className="flex gap-1">
            <span>Games Won:</span>
            <span className="font-medium">{player.totalWins}</span>
          </div>
          <div className="flex gap-1">
            <span>Total Points:</span>
            <span className="font-medium">{player.totalPoints}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
