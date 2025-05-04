"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type BookProps = {
  cover: string;
  title: string;
  author?: string;
  progress?: string;
  rating?: number;
  link?: string;
  tiltDirection?: 'left' | 'right' | 'none';
};

// Default SVG fallback for books without covers
const BookPlaceholder = ({ title }: { title: string }) => (
  <div className="absolute inset-0 flex items-center justify-center p-2 bg-gray-100 dark:bg-zinc-700">
    <span className="text-xs text-zinc-700 dark:text-zinc-300 text-center line-clamp-4">
      {title}
    </span>
  </div>
);

const Book = ({ 
  cover, 
  title, 
  author, 
  progress, 
  rating,
  link,
  tiltDirection = 'none' 
}: BookProps) => {
  const [imageError, setImageError] = useState(false);
  const tiltAngle = tiltDirection === 'left' ? -2 : tiltDirection === 'right' ? 2 : 0;
  
  // Use our image proxy directly - no fancy transformations
  const imageUrl = cover 
    ? `/api/image-proxy?url=${encodeURIComponent(cover)}&title=${encodeURIComponent(title)}`
    : '';
  
  const bookContent = (
    <motion.div
      className="relative group"
      whileHover={{
        rotate: tiltAngle,
        y: -3,
        scale: 1.05,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
    >
      <div className="bg-whiteout dark:bg-zinc-800 overflow-hidden rounded-sm shadow-md aspect-[2/3] relative">
        {cover && !imageError ? (
          <Image
            src={imageUrl}
            alt={`Cover of ${title}`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <BookPlaceholder title={title} />
        )}
        
        {/* Progress overlay for currently reading books */}
        {progress && (
          <div className="absolute bottom-0 left-0 right-0 bg-blackout/70 dark:bg-zinc-900/80 text-whiteout py-0.5 px-1 text-[10px] text-center truncate">
            {progress}
          </div>
        )}
        
        {/* Rating overlay for read books */}
        {rating !== undefined && (
          <div className="absolute top-0 right-0 bg-blackout/70 dark:bg-zinc-900/80 text-pink-400 px-1 py-0.5 text-[10px] rounded-bl-sm">
            {Array.from({ length: rating }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blackout/80 dark:bg-zinc-800/90 text-whiteout p-1.5 rounded text-[10px] z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-36 max-w-full text-center pointer-events-none">
        <p className="font-medium truncate">{title}</p>
        {author && <p className="text-whiteout/70 dark:text-zinc-300/70 text-[8px] mt-0.5 truncate">{author}</p>}
      </div>
    </motion.div>
  );

  return link ? (
    <Link href={link} target="_blank" rel="noopener noreferrer">{bookContent}</Link>
  ) : bookContent;
};

export default Book; 