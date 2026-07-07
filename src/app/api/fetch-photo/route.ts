import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeSession } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse('Missing ID', { status: 400 });

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('kl_erp_session');
  if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

  const session = decodeSession(sessionCookie.value);
  
  try {
    const res = await fetch(`https://newerp.kluniversity.in/uploads/studentphotos/${id}.jpg`, {
      headers: {
        'Cookie': session.cookies.map((c: any) => `${c.name}=${c.value}`).join('; '),
        'Referer': 'https://newerp.kluniversity.in/',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!res.ok) {
      return new NextResponse('Photo not found', { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return new NextResponse('Error fetching photo', { status: 500 });
  }
}
