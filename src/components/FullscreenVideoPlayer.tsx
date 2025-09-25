import { useEffect, useRef } from 'react'

interface FullscreenVideoPlayerProps {
  videoPath: string
  onClose: () => void
}

export function FullscreenVideoPlayer({
  videoPath,
  onClose,
}: FullscreenVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    console.log('videoPath', videoPath)
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      console.log('handleEnded')
      onClose()
    }

    const handleClick = () => {
      console.log('handleClick')
      onClose()
    }

    // Play the video
    // video.play().catch(console.error)

    // Add event listeners
    video.addEventListener('ended', handleEnded)
    video.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('click', handleClick)
    }
  }, [onClose, videoPath])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={videoPath}
        className="h-full w-full"
        autoPlay
        muted
        playsInline
      />
    </div>
  )
}
