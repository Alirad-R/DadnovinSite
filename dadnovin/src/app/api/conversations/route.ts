import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    
    if (conversationId) {
      const messages = await prisma.conversation.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      });
      return NextResponse.json(messages);
    }

    const conversations = await prisma.conversation.findMany({
      distinct: ['conversationId'],
      orderBy: { createdAt: 'desc' },
      select: {
        conversationId: true,
        name: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
} 