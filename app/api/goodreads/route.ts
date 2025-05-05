import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser'; // Import the rss-parser

// This is a placeholder until you install rss-parser
// If you get a "Cannot find module 'rss-parser'" error, run:
// npm install rss-parser

// Define types for cleaner data handling
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

// Helper function to enhance Goodreads image URLs for higher quality
function enhanceGoodreadsImageUrl(url: string): string {
  if (!url) return url;
  try {
    let enhancedUrl = url.startsWith('http:') ? url.replace('http:', 'https:') : url;
    // Remove explicit size folders like /75x75/
    enhancedUrl = enhancedUrl.replace(/\/\d+x\d+\//g, '/'); 
    // Remove query parameters that might limit size
    enhancedUrl = enhancedUrl.replace(/\?.*$/g, ''); 
    // *** AGGRESSIVELY remove any size suffix like _SY75_ or _SX100_ ***
    enhancedUrl = enhancedUrl.replace(/\._S[XY]\d+_/, ''); 
    // Sometimes removing parameters leaves trailing underscores
    enhancedUrl = enhancedUrl.replace(/_\./g, '.');
    return enhancedUrl;
  } catch (e) {
    console.error(`Failed to enhance URL: ${url}`, e);
    return url;
  }
}

// Initialize the RSS Parser
const parser = new Parser({
  customFields: {
    item: [
      'book_image_url', // Goodreads specific field for cover
      'book_small_image_url',
      'book_medium_image_url',
      'book_large_image_url',
      'user_rating',
      'user_read_at',
      'user_date_added',
      'user_date_created',
      'user_shelves',
      'user_review',
      'average_rating',
      'book_published',
      'progress' // Custom field that might appear in updates?
    ]
  }
});

export async function GET(request: NextRequest) {
  const goodreadsUrl = 'https://www.goodreads.com/user/updates_rss/135088892';
  const currentlyReading: BookData[] = [];
  const recentlyRead: BookData[] = [];

  try {
    console.log(`Fetching Goodreads RSS feed: ${goodreadsUrl}`);
    // Fetch the RSS feed using the built-in fetch
    const response = await fetch(goodreadsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 21600 } // Revalidate every 6 hours
    });

    if (!response.ok) {
      console.error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const feed = await parser.parseString(xmlText);
    
    console.log(`Parsed ${feed.items.length} items from RSS feed.`);

    feed.items.forEach(item => {
      // *** Improved Title Extraction ***
      let bookTitle = 'Unknown Title';
      if (item.title) {
        // Try to capture the title within single quotes first
        const quoteMatch = item.title.match(/'([^']+)'/);
        if (quoteMatch && quoteMatch[1]) {
          bookTitle = quoteMatch[1];
        } else {
          // Fallback: try to capture after the status phrase
          const statusMatch = item.title.match(/(?:currently reading|rated|finished reading|added|reviewed)\s+(.*?)(?:\s+by\s+|$)/i);
          if (statusMatch && statusMatch[1]) {
            bookTitle = statusMatch[1].trim(); 
          }
           else {
            // Final fallback: use the whole title if no pattern matches
            bookTitle = item.title.trim();
           }
        }
      }
      
      const authorMatch = item.title?.match(/by\s+([^(]+)/i);
      const author = authorMatch ? authorMatch[1].trim() : undefined;
      
      // Prioritize larger image URLs if available
      let coverUrl = item.book_large_image_url || item.book_medium_image_url || item.book_image_url || item.book_small_image_url || '';
      
      // Fallback: try extracting from description if custom fields fail
      if (!coverUrl && item.content) {
          const imgMatch = item.content.match(/<img.*?src="(.*?)".*?>/i);
          if (imgMatch && imgMatch[1]) {
              coverUrl = imgMatch[1];
          }
      }
      
      // *** Pass the RAW coverUrl to be enhanced ***
      const enhancedCoverUrl = enhanceGoodreadsImageUrl(coverUrl);
      const link = item.link;
      
      // Determine status and extract specific data
      if (item.title?.includes('currently reading')) {
        // Extract progress (might need adjustment based on actual feed content)
        let progress = item.progress || undefined;
        if (!progress && item.content) {
           const progressMatch = item.content.match(/(page \d+ of \d+|\d+% done|on page \d+)/i);
           if (progressMatch) progress = progressMatch[1];
        }
        
        currentlyReading.push({
          cover: enhancedCoverUrl,
          title: bookTitle,
          author,
          progress,
          link
        });
      } else if (item.title?.includes('rated') || item.title?.includes('finished reading')) {
        let rating = item.user_rating ? parseInt(item.user_rating, 10) : undefined;
        // Alternative rating extraction if user_rating field isn't present
        if (rating === undefined && item.content) {
          const starsMatch = item.content.match(/(★+)/);
          if (starsMatch) rating = starsMatch[1].length;
        }
        
        recentlyRead.push({
          cover: enhancedCoverUrl,
          title: bookTitle,
          author,
          rating,
          link
        });
      }
      // Can add handling for other statuses like 'added', 'reviewed' if needed
    });

    console.log("Successfully parsed Goodreads data:", { currentlyReading: currentlyReading.length, recentlyRead: recentlyRead.length });

    return NextResponse.json(
      { currentlyReading, recentlyRead },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' // Cache for 6 hours, allow stale for 24h
        }
      }
    );

  } catch (error: any) {
    console.error('Error processing Goodreads RSS feed:', error);
    // Return empty arrays on error to avoid breaking the UI, 
    // relies on ReadingShelf component's sample data logic
    return NextResponse.json(
      { currentlyReading: [], recentlyRead: [], error: error.message || 'Failed to process feed' },
      { status: 500 }
    );
  }
} 