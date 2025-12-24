import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET all tasks with their substeps
export async function GET() {
  try {
    const sql = getDb()
    const tasks = await sql`
      SELECT
        t.id,
        t.text,
        t.due,
        TO_CHAR(t.exact_date, 'Dy, Mon DD') as exact_date_display,
        TO_CHAR(t.exact_date, 'YYYY-MM-DD') as exact_date_raw,
        t.completed,
        t.created_at,
        t.scheduled_time,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'text', s.text, 'completed', s.completed)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as substeps
      FROM tasks t
      LEFT JOIN substeps s ON s.task_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      text: task.text,
      due: task.due,
      exactDateDisplay: task.exact_date_display,
      exactDateRaw: task.exact_date_raw,
      completed: task.completed,
      createdAt: task.created_at,
      scheduledTime: task.scheduled_time,
      subSteps: task.due === 'project' ? task.substeps : undefined
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST create a new task
export async function POST(request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { text, due, exactDate } = body

    const result = await sql`
      INSERT INTO tasks (text, due, exact_date)
      VALUES (${text}, ${due}, ${exactDate || null})
      RETURNING id, text, due, TO_CHAR(exact_date, 'Dy, Mon DD') as exact_date_display, TO_CHAR(exact_date, 'YYYY-MM-DD') as exact_date_raw, completed, created_at
    `

    const task = result[0]
    return NextResponse.json({
      id: task.id,
      text: task.text,
      due: task.due,
      exactDateDisplay: task.exact_date_display,
      exactDateRaw: task.exact_date_raw,
      completed: task.completed,
      createdAt: task.created_at,
      subSteps: due === 'project' ? [] : undefined
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
