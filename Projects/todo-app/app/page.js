'use client'

import { useState, useEffect } from 'react'

const DUE_OPTIONS = [
  { id: 'today', label: 'Today', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)', glow: 'rgba(185, 28, 28, 0.35)' },
  { id: 'tomorrow', label: 'Tomorrow', gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 50%, #831843 100%)', glow: 'rgba(219, 39, 119, 0.35)' },
  { id: 'exact', label: 'Exact Date', gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)', glow: 'rgba(37, 99, 235, 0.35)' },
  { id: 'later', label: 'For Later', gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)', glow: 'rgba(22, 163, 74, 0.35)' },
]

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [selectedDue, setSelectedDue] = useState('today')
  const [exactDate, setExactDate] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tasks')
    if (saved) {
      setTasks(JSON.parse(saved))
    }
    setIsLoaded(true)
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tasks', JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    if (selectedDue === 'exact' && !exactDate) return

    const task = {
      id: Date.now(),
      text: newTask.trim(),
      due: selectedDue,
      exactDate: selectedDue === 'exact' ? exactDate : null,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTasks([task, ...tasks])
    setNewTask('')
    setExactDate('')
  }

  const toggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const getDueOption = (dueId) => DUE_OPTIONS.find(d => d.id === dueId)

  const formatExactDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Group tasks by due type
  const groupedTasks = DUE_OPTIONS.reduce((acc, option) => {
    acc[option.id] = tasks.filter(t => t.due === option.id && !t.completed)
    return acc
  }, {})

  const completedTasks = tasks.filter(t => t.completed)

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>Tasks</h1>
          <p style={styles.subtitle}>
            {tasks.filter(t => !t.completed).length} active · {completedTasks.length} done
          </p>
        </header>

        {/* Add Task Form */}
        <form onSubmit={addTask} style={styles.form}>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              style={styles.textInput}
            />
          </div>
          
          <div style={styles.dueSelector}>
            {DUE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedDue(option.id)}
                style={{
                  ...styles.dueButton,
                  background: selectedDue === option.id ? option.gradient : 'rgba(255,255,255,0.05)',
                  boxShadow: selectedDue === option.id ? `0 4px 20px ${option.glow}` : 'none',
                  transform: selectedDue === option.id ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {selectedDue === 'exact' && (
            <div style={styles.dateInputWrapper}>
              <input
                type="date"
                value={exactDate}
                onChange={(e) => setExactDate(e.target.value)}
                style={styles.dateInput}
                required
              />
            </div>
          )}

          <button type="submit" style={styles.addButton}>
            Add Task
          </button>
        </form>

        {/* Task Lists */}
        <div style={styles.taskLists}>
          {DUE_OPTIONS.map((option) => {
            const categoryTasks = groupedTasks[option.id]
            if (categoryTasks.length === 0) return null

            return (
              <section key={option.id} style={styles.section}>
                <h2 style={styles.sectionTitle}>{option.label}</h2>
                <div style={styles.taskList}>
                  {categoryTasks.map((task, index) => (
                    <TaskBar
                      key={task.id}
                      task={task}
                      option={option}
                      onToggle={() => toggleComplete(task.id)}
                      onDelete={() => deleteTask(task.id)}
                      formatExactDate={formatExactDate}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Completed Section */}
          {completedTasks.length > 0 && (
            <section style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: 'rgba(255,255,255,0.4)' }}>Completed</h2>
              <div style={styles.taskList}>
                {completedTasks.map((task, index) => (
                  <TaskBar
                    key={task.id}
                    task={task}
                    option={getDueOption(task.due)}
                    onToggle={() => toggleComplete(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    formatExactDate={formatExactDate}
                    completed
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {tasks.length === 0 && isLoaded && (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No tasks yet</p>
              <p style={styles.emptyHint}>Add your first task above</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function TaskBar({ task, option, onToggle, onDelete, formatExactDate, completed, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        ...styles.taskBar,
        background: completed
          ? 'rgba(255,255,255,0.03)'
          : option.gradient,
        opacity: completed ? 0.5 : 1,
        boxShadow: completed
          ? 'none'
          : isHovered
            ? `0 8px 40px ${option.glow}, 0 0 0 1px rgba(255,255,255,0.1)`
            : `0 4px 20px ${option.glow}`,
        transform: isHovered && !completed ? 'translateX(4px)' : 'translateX(0)',
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onToggle}
        style={{
          ...styles.checkbox,
          background: completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
          borderColor: completed ? 'transparent' : 'rgba(255,255,255,0.3)',
        }}
      >
        {completed && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>

      <div style={styles.taskContent}>
        <span style={{
          ...styles.taskText,
          textDecoration: completed ? 'line-through' : 'none',
        }}>
          {task.text}
        </span>
        {task.exactDate && !completed && (
          <span style={styles.dateLabel}>
            {formatExactDate(task.exactDate)}
          </span>
        )}
      </div>

      <button
        onClick={onDelete}
        style={{
          ...styles.deleteButton,
          opacity: isHovered || completed ? 1 : 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  )
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: '40px 20px 80px',
    position: 'relative',
    zIndex: 1,
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '48px',
    textAlign: 'center',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.05em',
  },
  form: {
    marginBottom: '48px',
  },
  inputRow: {
    marginBottom: '16px',
  },
  textInput: {
    width: '100%',
    padding: '20px 24px',
    fontSize: '1.1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  dueSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  dueButton: {
    padding: '14px 16px',
    fontSize: '0.9rem',
    fontWeight: '500',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dateInputWrapper: {
    marginBottom: '16px',
  },
  dateInput: {
    width: '100%',
    padding: '16px 20px',
    fontSize: '1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    colorScheme: 'dark',
  },
  addButton: {
    width: '100%',
    padding: '18px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  taskLists: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  section: {},
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '16px',
    fontFamily: "'Space Mono', monospace",
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    borderRadius: '16px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'slideIn 0.3s ease forwards',
  },
  checkbox: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '2px solid',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  taskContent: {
    flex: 1,
    marginLeft: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  taskText: {
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dateLabel: {
    fontSize: '0.8rem',
    fontFamily: "'Space Mono', monospace",
    background: 'rgba(0,0,0,0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  deleteButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '12px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    fontSize: '1.3rem',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: '8px',
  },
  emptyHint: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.2)',
  },
}
