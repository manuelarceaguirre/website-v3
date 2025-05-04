"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Book from "./Book";

type BookData = {
  cover: string;
  title: string;
  author?: string;
  progress?: string;
  rating?: number;
  link?: string;
};

type GoodreadsData = {
  currentlyReading: BookData[];
  recentlyRead: BookData[];
};

const shelfVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.05
    }
  }
};

const bookVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const tiltDirections = ['left', 'right', 'none'] as const;

// Sample books for testing when there are no books from Goodreads
const sampleBooks: BookData[] = [
  {
    title: "The Sound and the Fury",
    author: "William Faulkner",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1551974950l/10975._SY475_.jpg",
    progress: "62%"
  },
  {
    title: "Never Let Me Go",
    author: "Kazuo Ishiguro",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1353048590l/6334.jpg",
    progress: "page 87 of 288"
  },
  {
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1699682395l/11297._SY475_.jpg",
    progress: "33%"
  }
];

const sampleFinished: BookData[] = [
  {
    title: "Kafka on the Shore",
    author: "Haruki Murakami",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1429638085l/4929.jpg",
    rating: 5
  },
  {
    title: "The Remains of the Day",
    author: "Kazuo Ishiguro",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327128714l/28921.jpg",
    rating: 4
  },
  {
    title: "As I Lay Dying",
    author: "William Faulkner",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1451810741l/77013._SY475_.jpg",
    rating: 5
  },
  {
    title: "Wind/Pinball",
    author: "Haruki Murakami",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1419853433l/22898819.jpg",
    rating: 4
  },
  {
    title: "The Buried Giant",
    author: "Kazuo Ishiguro",
    cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1407008458l/22522805.jpg",
    rating: 3
  }
];

const ReadingShelf = () => {
  const [data, setData] = useState<GoodreadsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // For alternating tilt directions
  const [tiltMap, setTiltMap] = useState<Map<string, typeof tiltDirections[number]>>(new Map());
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/goodreads');
        if (!response.ok) {
          throw new Error('Failed to fetch Goodreads data');
        }
        const goodreadsData = await response.json();
        
        // If we have no data or very little data, supplement with sample books
        if (!goodreadsData.currentlyReading || goodreadsData.currentlyReading.length < 2) {
          // Use the real book if it exists and add sample books
          const realBooks = goodreadsData.currentlyReading || [];
          goodreadsData.currentlyReading = [...realBooks, ...sampleBooks.slice(0, Math.min(3, 5 - realBooks.length))];
        }
        
        if (!goodreadsData.recentlyRead || goodreadsData.recentlyRead.length < 3) {
          // Use the real books if they exist and add sample books
          const realBooks = goodreadsData.recentlyRead || [];
          goodreadsData.recentlyRead = [...realBooks, ...sampleFinished.slice(0, Math.min(5, 5 - realBooks.length))];
        }
        
        setData(goodreadsData);
        
        // Assign random tilt directions to books
        const newTiltMap = new Map<string, typeof tiltDirections[number]>();
        
        [...goodreadsData.currentlyReading, ...goodreadsData.recentlyRead].forEach((book, index) => {
          // Alternate tilt directions for a more natural bookshelf look
          const tiltPattern = ['left', 'right', 'none', 'right', 'left'];
          newTiltMap.set(book.title, tiltDirections[index % tiltDirections.length]);
        });
        
        setTiltMap(newTiltMap);
      } catch (err) {
        console.error(err);
        
        // When API fails, use sample data instead of showing error
        const sampleData = {
          currentlyReading: sampleBooks,
          recentlyRead: sampleFinished
        };
        
        setData(sampleData);
        
        // Assign tilt directions
        const newTiltMap = new Map<string, typeof tiltDirections[number]>();
        [...sampleBooks, ...sampleFinished].forEach((book, index) => {
          const tiltPattern = ['left', 'right', 'none', 'right', 'left'];
          newTiltMap.set(book.title, tiltDirections[index % tiltDirections.length]);
        });
        
        setTiltMap(newTiltMap);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (error && !data) return (
    <div className="text-red-500 text-sm opacity-75">{error}</div>
  );
  
  if (isLoading) return (
    <div className="animate-pulse text-sm opacity-75">Loading Michelle's bookshelf...</div>
  );
  
  return (
    <div className="w-full">
      {data?.currentlyReading && data.currentlyReading.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-medium mb-3 text-blackout dark:text-whiteout flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-400">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            Currently reading
          </h3>
          <motion.div 
            className="grid grid-cols-3 md:grid-cols-5 gap-3" 
            variants={shelfVariants}
            initial="hidden"
            animate="visible"
          >
            {data.currentlyReading.slice(0, 5).map((book, index) => (
              <motion.div key={`${book.title}-${index}`} variants={bookVariants} className="w-full">
                <Book 
                  {...book} 
                  tiltDirection={tiltMap.get(book.title) || 'none'} 
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReadingShelf; 