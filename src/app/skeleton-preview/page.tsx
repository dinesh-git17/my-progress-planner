// src/app/skeleton-preview/page.tsx
'use client';

import HomePageSkeleton from '@/components/HomePageSkeleton';
import Link from 'next/link';
import { useState } from 'react';

export default function SkeletonPreviewPage() {
  const [showSkeleton, setShowSkeleton] = useState(true);

  if (showSkeleton) {
    return (
      <>
        <HomePageSkeleton />

        {/* Preview Controls */}
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg">
          <h3 className="font-bold mb-2">Skeleton Preview</h3>
          <button
            onClick={() => setShowSkeleton(false)}
            className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm"
          >
            Hide Skeleton
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Skeleton Preview</h1>
        <p className="text-gray-600 mb-4">
          This is what the skeleton looked like!
        </p>
        <button
          onClick={() => setShowSkeleton(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Show Skeleton Again
        </button>
        <br />
        <br />
        <Link href="/" className="text-blue-500 underline">
          Go back to homepage
        </Link>
      </div>
    </div>
  );
}
