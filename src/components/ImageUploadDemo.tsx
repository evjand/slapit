import React from 'react'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'

// Demo component to showcase the image upload functionality
export function ImageUploadDemo() {
  // Sample player with and without images
  const samplePlayerWithImage = {
    _id: 'player_with_image' as Id<'players'>,
    name: 'Alice',
    imageStorageId: 'storage_123' as Id<'_storage'>,
  }

  const samplePlayerWithoutImage = {
    _id: 'player_without_image' as Id<'players'>,
    name: 'Bob',
    imageStorageId: undefined,
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Player Image Upload Demo</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Players can now have custom images instead of generated avatars.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Player with Custom Image</h3>
          <div className="flex items-center space-x-4">
            <SimpleUserAvatar
              userId={samplePlayerWithImage._id}
              size="lg"
              imageStorageId={samplePlayerWithImage.imageStorageId}
            />
            <div>
              <h4 className="font-semibold">{samplePlayerWithImage.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Custom image displayed
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Player with Generated Avatar
          </h3>
          <div className="flex items-center space-x-4">
            <SimpleUserAvatar
              userId={samplePlayerWithoutImage._id}
              size="lg"
              imageStorageId={samplePlayerWithoutImage.imageStorageId}
            />
            <div>
              <h4 className="font-semibold">{samplePlayerWithoutImage.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generated pattern displayed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="mb-2 font-semibold">Features:</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Upload images from device or take photos with camera</li>
          <li>• Webcam capture works on laptops and desktop computers</li>
          <li>• Mobile camera capture for phones and tablets</li>
          <li>• Images are stored securely using Convex File Storage</li>
          <li>
            • Automatic fallback to generated avatars when no image is set
          </li>
          <li>• Easy image removal and replacement</li>
          <li>• Images display consistently across all game views</li>
          <li>• Optimized for different avatar sizes (sm, md, lg, xl)</li>
        </ul>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
        <h4 className="mb-2 font-semibold text-blue-800 dark:text-blue-200">
          How to use:
        </h4>
        <ol className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>1. Go to the Player Pool page</li>
          <li>2. Click "Upload" to select an image from your device</li>
          <li>
            3. Click "Camera" to take a photo with your webcam or mobile camera
          </li>
          <li>4. Use the camera modal to capture and preview your photo</li>
          <li>5. Click the "X" button to remove an existing image</li>
          <li>6. Images will automatically appear in all game views</li>
        </ol>
      </div>
    </div>
  )
}
