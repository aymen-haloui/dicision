import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params

  if (!category) {
    return NextResponse.json(
      { error: 'Missing category parameter' },
      { status: 400 }
    )
  }

  try {
    const options = await prisma.option.findMany({
      where: { category },
      orderBy: { order: 'asc' },
      select: { value: true, label: true },
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching options for category', category, error)
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    )
  }
}