import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST create a new substep
export async function POST(request, { params }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const { text } = body

    const result = await sql`
      INSERT INTO substeps (task_id, text)
      VALUES (${id}, ${text})
      RETURNING id, text, completed
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating substep:', error)
    return NextResponse.json({ error: 'Failed to create substep' }, { status: 500 })
  }
}
