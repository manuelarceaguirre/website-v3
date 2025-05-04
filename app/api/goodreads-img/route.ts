import { NextRequest } from 'next/server';

export const runtime = 'edge';               // Edge = fast + cheap CDN cache
const GOODREADS_HOSTS = ['i.gr-assets.com', 'images.gr-assets.com', 's.gr-assets.com', 'www.goodreads.com'];
const DEFAULT_COVER = "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";

export async function GET(req: NextRequest) {
  // ?src=https://i.gr-assets.com/...
  const url = req.nextUrl.searchParams.get('src');
  if (!url) return new Response('src missing', { status: 400 });

  try {
    const target = new URL(url);
    
    // Allow our selected image hosts
    if (!GOODREADS_HOSTS.includes(target.hostname)) {
      console.log(`Forbidden host in image request: ${target.hostname}`);
      // Return the default image instead of an error
      return getDefaultCoverImage();
    }

    // Fetch with multiple user agents to improve success rate and bypass rate limiting
    const headers = getRandomUserAgentHeaders();

    const imgRes = await fetch(target.toString(), { headers });

    // If we get a non-successful response, try the default cover
    if (!imgRes.ok) {
      console.log(`Failed to load image from ${target.toString()}: ${imgRes.status}`);
      return getDefaultCoverImage();
    }

    // Copy bytes through, add long cache
    return new Response(imgRes.body, {
      status: 200,
      headers: {
        'Content-Type': imgRes.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, s-maxage=2592000, max-age=2592000', // 30 days
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return getDefaultCoverImage();
  }
}

// Helper function to get the default cover image
async function getDefaultCoverImage() {
  try {
    const defaultImage = await fetch(DEFAULT_COVER, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.goodreads.com/',
      }
    });
    
    if (!defaultImage.ok) {
      // If even the default fails, return an SVG
      return getFallbackSvg();
    }
    
    const imageData = await defaultImage.arrayBuffer();
    
    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, s-maxage=2592000, max-age=2592000',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return getFallbackSvg();
  }
}

// Generate an SVG fallback for the absolute worst case
function getFallbackSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="225" viewBox="0 0 150 225">
    <rect width="150" height="225" fill="#f0f0f0"/>
    <rect x="15" y="15" width="120" height="195" fill="#e0e0e0" rx="2" ry="2"/>
    <text x="75" y="112.5" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">Book cover</text>
  </svg>`;
  
  return new Response(svg, {
    headers: { 
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=2592000, max-age=2592000',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Get random user agent headers to avoid rate limiting
function getRandomUserAgentHeaders() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76'
  ];
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Referer': 'https://www.goodreads.com/',
    'Origin': 'https://www.goodreads.com',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  };
} 