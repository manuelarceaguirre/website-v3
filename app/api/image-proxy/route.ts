import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const DEFAULT_BOOK_COVER = 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png';
const FALLBACK_COVERS: Record<string, string> = {
  'Never Let Me Go': 'https://images.squarespace-cdn.com/content/v1/55c4be0be4b0ba943d74a433/1554243372947-MZXRGIZJNPZVHC0QCLZL/Never+Let+Me+Go+-+Kazuo+Ishiguro.jpg',
  'Queen of Shadows': 'https://m.media-amazon.com/images/I/61KS6-d9I9L._AC_UF1000,1000_QL80_.jpg',
  'Norwegian Wood': 'https://m.media-amazon.com/images/I/71piKAdU7fL._AC_UF1000,1000_QL80_.jpg'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const bookTitle = searchParams.get('title') || '';
  
  if (!imageUrl) {
    return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
  }
  
  try {
    // First check if we have a manual fallback for this specific book
    if (bookTitle && FALLBACK_COVERS[bookTitle]) {
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
    
    // If no fallback or fallback failed, try the original URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.goodreads.com/',
        'Origin': 'https://www.goodreads.com'
      }
    });
    
    if (!response.ok) {
      // If the image can't be fetched, return the default image
      const defaultImage = await fetch(DEFAULT_BOOK_COVER);
      const imageData = await defaultImage.arrayBuffer();
      
      return new NextResponse(imageData, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=604800' // Cache for 7 days
        }
      });
    }
    
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // In case of any error, serve the default book cover
    try {
      const defaultImage = await fetch(DEFAULT_BOOK_COVER);
      const imageData = await defaultImage.arrayBuffer();
      
      return new NextResponse(imageData, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=604800' // Cache for 7 days
        }
      });
    } catch (fallbackError) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
  }
} 