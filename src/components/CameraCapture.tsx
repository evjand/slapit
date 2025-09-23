import React, { useRef, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Camera, X, RotateCw } from 'lucide-react'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  playerName?: string
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  playerName,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  const startCamera = async () => {
    try {
      setError(null)

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsStreaming(true)
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please check permissions.')
      setIsStreaming(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Create a file from the blob
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
          onCapture(file)
          onClose()
        }
      },
      'image/jpeg',
      0.8,
    )
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Take Photo{playerName ? ` for ${playerName}` : ''}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-lg bg-gray-100">
                <video
                  ref={videoRef}
                  className="h-64 w-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                      <p className="text-sm text-gray-600">
                        Starting camera...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>

                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  disabled={!isStreaming}
                  title="Switch camera"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-gray-500">
                Click "Capture Photo" to take a picture, or use the rotate
                button to switch between front and back cameras.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
