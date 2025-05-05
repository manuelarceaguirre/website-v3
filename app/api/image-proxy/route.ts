import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const DEFAULT_BOOK_COVER = 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png';
// Expanded list of allowed hosts
const ALLOWED_HOSTS = [
  'i.gr-assets.com', 
  'images.gr-assets.com', 
  's.gr-assets.com', 
  'www.goodreads.com',
  'm.media-amazon.com',
  'covers.openlibrary.org',
  'books.google.com',
  'images.squarespace-cdn.com',
  'images-na.ssl-images-amazon.com'
];

const FALLBACK_COVERS: Record<string, string> = {
  'Never Let Me Go': 'https://images.squarespace-cdn.com/content/v1/55c4be0be4b0ba943d74a433/1554243372947-MZXRGIZJNPZVHC0QCLZL/Never+Let+Me+Go+-+Kazuo+Ishiguro.jpg',
  'Queen of Shadows': 'https://m.media-amazon.com/images/I/61KS6-d9I9L._AC_UF1000,1000_QL80_.jpg',
  'Norwegian Wood': 'https://m.media-amazon.com/images/I/71piKAdU7fL._AC_UF1000,1000_QL80_.jpg'
};

// Get random user agent headers to avoid rate limiting
function getModernFetchHeaders(refererUrl?: string | null) {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76'
  ];
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Referer': refererUrl || 'https://www.goodreads.com/',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Dest': 'image'
  };
}

// Generate an SVG fallback for the absolute worst case
function getFallbackSvg(title: string = 'Book cover') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="225" viewBox="0 0 150 225">
    <rect width="150" height="225" fill="#f0f0f0"/>
    <rect x="15" y="15" width="120" height="195" fill="#e0e0e0" rx="2" ry="2"/>
    <text x="75" y="112.5" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">${title}</text>
  </svg>`;
  
  return new Response(svg, {
    headers: { 
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=2592000, max-age=2592000',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const originalUrl = searchParams.get('original');
  const bookTitle = searchParams.get('title') || '';
  const bookPageUrl = searchParams.get('page');
  const isRetry = searchParams.get('retry') === 'true';
  
  if (!imageUrl) {
    return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
  }
  
  console.log(`Image proxy request for: ${imageUrl?.substring(0, 100)}${imageUrl && imageUrl.length > 100 ? '...' : ''}, Referer: ${bookPageUrl}`);
  
  try {
    // Check if URL is from an allowed host
    const targetUrl = new URL(imageUrl);
    
    if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
      console.log(`Host not in allowed list: ${targetUrl.hostname}`);
      // Don't immediately fall back - try to fetch it anyway
      // But log it so we can add to allowed hosts if needed
    }
    
    // First check if we have a manual fallback for this specific book
    if (bookTitle && FALLBACK_COVERS[bookTitle]) {
      console.log(`Using custom fallback for "${bookTitle}"`);
      const fallbackResponse = await fetch(FALLBACK_COVERS[bookTitle]);
      if (fallbackResponse.ok) {
        const imageData = await fallbackResponse.arrayBuffer();
        const contentType = fallbackResponse.headers.get('Content-Type') || 'image/jpeg';
        
        return new NextResponse(imageData, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800' // Cache for 7 days
          }
        });
      }
    }
    
    // If no fallback or fallback failed, try fetching the image
    const headers = getModernFetchHeaders(bookPageUrl);
    console.log('Fetching with headers:', headers);
    const response = await fetch(imageUrl, { 
      headers: headers, 
      cache: "force-cache"
    }); 
    
    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText} for ${imageUrl}`);
      
      // Try the original URL if this is an enhanced URL and we haven't tried the original yet
      if (originalUrl && originalUrl !== imageUrl && !isRetry) {
        console.log(`Trying original URL: ${originalUrl}`);
        const retryUrl = new URL(request.url);
        retryUrl.searchParams.set('url', originalUrl);
        retryUrl.searchParams.delete('original');
        retryUrl.searchParams.set('retry', 'true');
        return NextResponse.redirect(retryUrl, 307);
      }
      
      // If the image can't be fetched, check if it's a no-photo URL
      if (imageUrl.includes('nophoto/book')) {
        console.log('Detected no-photo placeholder, serving default cover');
        return getNoPhotoResponse(bookTitle, bookPageUrl);
      }
      
      // As a last resort, fetch the default image
      console.log('Serving default cover as fallback');
      return getNoPhotoResponse(bookTitle, bookPageUrl);
    }
    
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // In case of any error, serve the default book cover
    return getNoPhotoResponse(bookTitle, bookPageUrl);
  }
}

// Helper function to get the default cover image
async function getNoPhotoResponse(bookTitle: string, refererUrl?: string | null) {
  try {
    const defaultImage = await fetch(DEFAULT_BOOK_COVER, {
      headers: getModernFetchHeaders(refererUrl)
    });
    
    if (!defaultImage.ok) {
      // If even the default fails, return an SVG
      return getFallbackSvg(bookTitle || 'Book cover');
    }
    
    const imageData = await defaultImage.arrayBuffer();
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800', // Cache for 7 days
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (fallbackError) {
    // As a last resort, return an SVG
    return getFallbackSvg(bookTitle || 'Book cover');
  }
} 