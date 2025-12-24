import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

// PATCH update a task (toggle complete or schedule time)
export async function PATCH(request, { params }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const { completed, scheduledTime } = body

    // Handle scheduling update
    if (scheduledTime !== undefined) {
      const result = await sql`
        UPDATE tasks
        SET scheduled_time = ${scheduledTime}
        WHERE id = ${id}
        RETURNING id, scheduled_time
      `

      if (result.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      return NextResponse.json({
        id: result[0].id,
        scheduledTime: result[0].scheduled_time
      })
    }

    // Handle completed update
    const result = await sql`
      UPDATE tasks
      SET completed = ${completed}
      WHERE id = ${id}
      RETURNING id, completed
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE a task
export async function DELETE(request, { params }) {
  try {
    const sql = getDb()
    const { id } = await params

    const result = await sql`
      DELETE FROM tasks
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
