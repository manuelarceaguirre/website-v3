import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder until you install rss-parser
// If you get a "Cannot find module 'rss-parser'" error, run:
// npm install rss-parser

export const runtime = 'edge';

// Helper function to enhance Goodreads image URLs for higher quality
function enhanceGoodreadsImageUrl(url: string): string {
  if (!url) return url;

  try {
    // Ensure HTTPS
    let enhancedUrl = url.startsWith('http:') ? url.replace('http:', 'https:') : url;

    // Remove or replace size constraints for better quality
    // Common patterns: ._SX<size>_, ._SY<size>_, ._SX<size>SY<size>_, etc.
    enhancedUrl = enhancedUrl.replace(/\._(SX|SY|SS|QL|CR|AC|SR|RC)\d*?_/g, '_');
    enhancedUrl = enhancedUrl.replace(/\/\d+x\d+\//g, '/'); // Remove size folders like /75x75/
    enhancedUrl = enhancedUrl.replace(/\?.*$/g, ''); // Remove query parameters that might limit size

    // Sometimes removing the parameters leaves trailing underscores
    enhancedUrl = enhancedUrl.replace(/_\./g, '.');

    return enhancedUrl;
  } catch (e) {
    console.error(`Failed to enhance URL: ${url}`, e);
    return url; // Return original URL on error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Directly fetch the RSS feed
    const response = await fetch('https://www.goodreads.com/user/updates_rss/135088892', {
      next: { revalidate: 21600 } // 6 hours cache
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Simple XML parsing (not ideal but works until you install rss-parser)
    const currentlyReading = [];
    const recentlyRead = [];
    
    // Extract book info using regex (temporary solution)
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const [_, title, link, description, pubDate] = match;
      
      // Try multiple image extraction patterns
      let coverUrl = '';
      
      // Pattern 1: Standard img tag
      const imgMatch = description.match(/<img.*?src="(.*?)".*?>/i);
      if (imgMatch && imgMatch[1]) {
        coverUrl = imgMatch[1];
      }
      
      // Pattern 2: Sometimes images are in a different format with escaped quotes
      if (!coverUrl) {
        const altImgMatch = description.match(/src=\\"(.*?)\\"/i);
        if (altImgMatch && altImgMatch[1]) {
          coverUrl = altImgMatch[1].replace(/\\\//g, '/');
        }
      }
      
      // Pattern 3: Look for book cover URL pattern directly
      if (!coverUrl) {
        const directUrlMatch = description.match(/https?:\/\/i\.gr-assets\.com\/images\/\S+\.jpg/i);
        if (directUrlMatch) {
          coverUrl = directUrlMatch[0];
        }
      }
      
      // Enhance the extracted URL for better quality
      const enhancedCoverUrl = enhanceGoodreadsImageUrl(coverUrl);

      // Check for reading status
      if (title.includes('is currently reading')) {
        const titleMatch = title.match(/is currently reading\s+(.*?)(\s+by\s+|$)/i);
        const bookTitle = titleMatch ? titleMatch[1] : '';
        
        const authorMatch = title.match(/by\s+([^(]+)/i);
        const author = authorMatch ? authorMatch[1].trim() : undefined;
        
        // Try multiple progress extraction patterns
        let progress = undefined;
        
        // Pattern 1: Standard format "page X of Y"
        const progressMatch = description.match(/(page \d+ of \d+|\d+%)/i);
        if (progressMatch) {
          progress = progressMatch[1];
        }
        
        // Pattern 2: Alternative format "X% done"
        if (!progress) {
          const altProgressMatch = description.match(/(\d+)% done/i);
          if (altProgressMatch) {
            progress = `${altProgressMatch[1]}%`;
          }
        }
        
        // Pattern 3: Absolute page number "on page X"
        if (!progress) {
          const pageMatch = description.match(/on page (\d+)/i);
          if (pageMatch) {
            progress = `page ${pageMatch[1]}`;
          }
        }
        
        currentlyReading.push({
          cover: enhancedCoverUrl,
          title: bookTitle,
          author,
          progress,
          link
        });
      } else if (title.includes('rated')) {
        const titleMatch = title.match(/rated\s+(.*?)(\s+by\s+|$)/i);
        const bookTitle = titleMatch ? titleMatch[1] : '';
        
        const authorMatch = title.match(/by\s+([^(]+)/i);
        const author = authorMatch ? authorMatch[1].trim() : undefined;
        
        // Multiple rating extraction patterns
        let rating = undefined;
        
        // Pattern 1: Standard format "X of 5 stars"
        const ratingMatch = title.match(/(\d+) of 5 stars/i);
        if (ratingMatch) {
          rating = parseInt(ratingMatch[1]);
        }
        
        // Pattern 2: Simple stars format "★★★☆☆"
        if (!rating) {
          const starsMatch = description.match(/(★+)/);
          if (starsMatch) {
            rating = starsMatch[1].length;
          }
        }
        
        recentlyRead.push({
          cover: enhancedCoverUrl,
          title: bookTitle,
          author,
          rating,
          link
        });
      }
    }
    
    return NextResponse.json(
      { currentlyReading, recentlyRead },
      {
        headers: {
          'Cache-Control': 's-maxage=21600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching Goodreads data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Goodreads data' },
      { status: 500 }
    );
  }
} 