import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

// PATCH update a substep (toggle complete)
export async function PATCH(request, { params }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const { completed } = body

    const result = await sql`
      UPDATE substeps
      SET completed = ${completed}
      WHERE id = ${id}
      RETURNING id, completed
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Substep not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating substep:', error)
    return NextResponse.json({ error: 'Failed to update substep' }, { status: 500 })
  }
}

// DELETE a substep
export async function DELETE(request, { params }) {
  try {
    const sql = getDb()
    const { id } = await params

    const result = await sql`
      DELETE FROM substeps
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Substep not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting substep:', error)
    return NextResponse.json({ error: 'Failed to delete substep' }, { status: 500 })
  }
}
