import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const options = await prisma.option.findMany({
      where: { category: params.category },
      orderBy: { order: 'asc' },
      select: { value: true, label: true }
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    )
  }
}