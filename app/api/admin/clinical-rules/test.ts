import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runAllTests } from '@/lib/clinical-engine/tests'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capture console output
    const logs: string[] = []
    const originalLog = console.log
    const originalAssert = console.assert

    console.log = (...args) => {
      logs.push(args.map(String).join(' '))
      originalLog(...args)
    }

    console.assert = (condition, ...args) => {
      if (!condition) {
        logs.push(`ASSERTION FAILED: ${args.map(String).join(' ')}`)
      }
      originalAssert(condition, ...args)
    }

    runAllTests()

    // Restore console
    console.log = originalLog
    console.assert = originalAssert

    return NextResponse.json({
      success: true,
      tests_run: 8,
      logs,
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: error.message || 'Testing failed' },
      { status: 500 }
    )
  }
}
