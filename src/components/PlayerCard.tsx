import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import { Player, PlayerCardProps } from '../types'
import { Button } from './ui/button'
import { Camera, MoreVertical, Trash2, Upload, X, Edit3 } from 'lucide-react'
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
import { Input } from './ui/input'

export function PlayerCard({ player }: { player: Player }) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadingPlayerId, setUploadingPlayerId] =
    useState<Id<'players'> | null>(null)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [cameraPlayerId, setCameraPlayerId] = useState<Id<'players'> | null>(
    null,
  )
  const [isEditingInitials, setIsEditingInitials] = useState(false)
  const [newInitials, setNewInitials] = useState(player.initials || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateUploadUrl = useMutation(api.players.generateUploadUrl)
  const updatePlayerImage = useMutation(api.players.updatePlayerImage)
  const removePlayerImage = useMutation(api.players.removePlayerImage)
  const deletePlayer = useMutation(api.players.deletePlayer)
  const updatePlayerInitials = useMutation(api.players.updatePlayerInitials)

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

  const handleSaveInitials = async () => {
    try {
      await updatePlayerInitials({
        playerId: player._id!,
        initials: newInitials.trim(),
      })
      setIsEditingInitials(false)
      toast.success('Initials updated successfully!')
    } catch (error) {
      toast.error('Failed to update initials')
    }
  }

  const handleCancelInitials = () => {
    setNewInitials(player.initials || '')
    setIsEditingInitials(false)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-4">
            <SimpleUserAvatar
              userId={player._id!}
              size="lg"
              imageStorageId={player.imageStorageId}
              initials={player.initials}
              name={player.name}
            />
            <div>
              <div className="text-xl font-bold">{player.name}</div>
              {player.initials && (
                <div className="text-muted-foreground text-sm">
                  {player.initials}
                </div>
              )}
            </div>
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
              <DropdownMenuItem onClick={() => setIsEditingInitials(true)}>
                <Edit3 className="mr-2 size-4" />
                Edit Initials
              </DropdownMenuItem>
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

        {isEditingInitials && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Initials (max 3 characters)
              </label>
              <Input
                value={newInitials}
                onChange={(e) =>
                  setNewInitials(e.target.value.toUpperCase().slice(0, 3))
                }
                placeholder="Enter initials"
                className="mt-1"
                maxLength={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveInitials}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelInitials}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
