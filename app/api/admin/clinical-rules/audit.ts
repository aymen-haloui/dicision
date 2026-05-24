import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuditForCase, getAuditForRule, getAllAuditRecords } from '@/lib/clinical-engine/audit'

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return session.user.id
}

export async function GET(request: NextRequest) {
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('case_id')
    const ruleId = searchParams.get('rule_id')
    const limit = parseInt(searchParams.get('limit') || '500')

    let records
    if (caseId) {
      records = await getAuditForCase(caseId)
    } else if (ruleId) {
      records = await getAuditForRule(ruleId, limit)
    } else {
      records = await getAllAuditRecords(limit)
    }

    return NextResponse.json(records)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des audits' }, { status: 500 })
  }
}
