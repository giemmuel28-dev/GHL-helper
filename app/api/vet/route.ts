import { NextRequest, NextResponse } from 'next/server';
import { vet } from '@/lib/vet';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { html, ghlFields, helloBarMessage, customSalesPageUrl } = body;

    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    const result = await vet({ html, ghlFields, helloBarMessage, customSalesPageUrl });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Vetting Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
