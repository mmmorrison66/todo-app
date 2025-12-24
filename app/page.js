'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'

const DUE_OPTIONS = [
  { id: 'today', label: 'Today', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)', glow: 'rgba(185, 28, 28, 0.35)' },
  { id: 'tomorrow', label: 'Tomorrow', gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 50%, #831843 100%)', glow: 'rgba(219, 39, 119, 0.35)' },
  { id: 'exact', label: 'Exact Date', gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)', glow: 'rgba(37, 99, 235, 0.35)' },
  { id: 'later', label: 'For Later', gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)', glow: 'rgba(22, 163, 74, 0.35)' },
  { id: 'project', label: 'Projects', gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)', glow: 'rgba(124, 58, 237, 0.35)' },
]

// Generate time slots from 5 AM to 11 PM (18 hours * 4 = 72 slots)
function generateTimeSlots() {
  const slots = []
  for (let hour = 5; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const isHour = minute === 0
      slots.push({
        id: timeStr,
        time: timeStr,
        display: isHour ? `${displayHour}:00 ${ampm}` : '',
        isHour,
      })
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

// Convert time string (HH:MM:SS or HH:MM) to slot index
function timeToSlotIndex(timeStr) {
  if (!timeStr) return -1
  const [hours, minutes] = timeStr.split(':').map(Number)
  const slotIndex = (hours - 5) * 4 + Math.floor(minutes / 15)
  return slotIndex >= 0 && slotIndex < TIME_SLOTS.length ? slotIndex : -1
}

// Draggable Task Component
function DraggableTask({ task, option, onToggle, onDelete, completed, index, onAddSubStep, onToggleSubStep, onDeleteSubStep }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <TaskBar
        task={task}
        option={option}
        onToggle={onToggle}
        onDelete={onDelete}
        completed={completed}
        index={index}
        onAddSubStep={onAddSubStep}
        onToggleSubStep={onToggleSubStep}
        onDeleteSubStep={onDeleteSubStep}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// Droppable Time Slot Component
function DroppableSlot({ slot, scheduledTask, getDueOption, onToggleTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.id}`,
    data: { slot },
  })

  // Format time for display (show all times, not just hours)
  const formatSlotTime = () => {
    const [hours, minutes] = slot.time.split(':').map(Number)
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    const ampm = hours >= 12 ? 'PM' : 'AM'
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.timeSlot,
        borderTop: slot.isHour ? '2px solid rgba(0,0,0,0.2)' : '1px solid rgba(0,0,0,0.08)',
        background: isOver
          ? 'rgba(124, 58, 237, 0.15)'
          : slot.isHour
            ? 'rgba(0,0,0,0.03)'
            : 'transparent',
      }}
    >
      <span style={{
        ...styles.timeLabel,
        fontWeight: slot.isHour ? '600' : '400',
        color: slot.isHour ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
        fontSize: slot.isHour ? '0.8rem' : '0.7rem',
      }}>
        {formatSlotTime()}
      </span>
      {scheduledTask && (
        <ScheduledTaskBlock
          task={scheduledTask}
          option={getDueOption(scheduledTask.due)}
          onToggle={() => onToggleTask(scheduledTask.id)}
        />
      )}
    </div>
  )
}

// Scheduled Task Block (displayed on grid) - now draggable
function ScheduledTaskBlock({ task, option, onToggle }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.scheduledTask,
        background: option?.gradient || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        style={styles.scheduledCheckbox}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>
      <div
        {...attributes}
        {...listeners}
        style={{ flex: 1, cursor: 'grab', overflow: 'hidden' }}
      >
        <span style={styles.scheduledTaskText}>{task.text}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [selectedDue, setSelectedDue] = useState('today')
  const [exactDate, setExactDate] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTask, setActiveTask] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTasks(data)
      } else {
        console.error('API returned non-array:', data)
        setTasks([])
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
      setIsLoaded(true)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    if (selectedDue === 'exact' && !exactDate) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newTask.trim(),
          due: selectedDue,
          exactDate: selectedDue === 'exact' ? exactDate : null,
        })
      })
      const task = await res.json()
      setTasks([task, ...tasks])
      setNewTask('')
      setExactDate('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const addSubStep = async (taskId, stepText) => {
    if (!stepText.trim()) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/substeps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stepText.trim() })
      })
      const newStep = await res.json()
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, subSteps: [...task.subSteps, newStep] }
        }
        return task
      }))
    } catch (error) {
      console.error('Error adding substep:', error)
    }
  }

  const toggleSubStep = async (taskId, stepId) => {
    const task = tasks.find(t => t.id === taskId)
    const step = task?.subSteps?.find(s => s.id === stepId)
    if (!step) return

    try {
      await fetch(`/api/substeps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !step.completed })
      })
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          const updatedSubSteps = t.subSteps.map(s =>
            s.id === stepId ? { ...s, completed: !s.completed } : s
          )
          return { ...t, subSteps: updatedSubSteps }
        }
        return t
      }))
    } catch (error) {
      console.error('Error toggling substep:', error)
    }
  }

  const deleteSubStep = async (taskId, stepId) => {
    try {
      await fetch(`/api/substeps/${stepId}`, { method: 'DELETE' })
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, subSteps: task.subSteps.filter(step => step.id !== stepId) }
        }
        return task
      }))
    } catch (error) {
      console.error('Error deleting substep:', error)
    }
  }

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })
      setTasks(tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ))
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks(tasks.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const scheduleTask = async (taskId, timeStr) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: timeStr })
      })
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, scheduledTime: timeStr } : t
      ))
    } catch (error) {
      console.error('Error scheduling task:', error)
    }
  }

  const unscheduleTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: null })
      })
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, scheduledTime: null } : t
      ))
    } catch (error) {
      console.error('Error unscheduling task:', error)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    const taskId = parseInt(active.id.replace('task-', ''))
    const task = tasks.find(t => t.id === taskId)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = parseInt(active.id.replace('task-', ''))

    // Check if dropped on a time slot
    if (over.id.toString().startsWith('slot-')) {
      const timeStr = over.id.replace('slot-', '')
      scheduleTask(taskId, timeStr)
    }
    // Check if dropped back on task list (unschedule)
    else if (over.id === 'task-list-drop') {
      unscheduleTask(taskId)
    }
  }

  const getDueOption = (dueId) => DUE_OPTIONS.find(d => d.id === dueId)

  // Separate scheduled and unscheduled tasks
  const unscheduledTasks = tasks.filter(t => !t.scheduledTime && !t.completed)
  const scheduledTasks = tasks.filter(t => t.scheduledTime && !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  // Group unscheduled tasks by due type
  const groupedTasks = DUE_OPTIONS.reduce((acc, option) => {
    acc[option.id] = unscheduledTasks.filter(t => t.due === option.id)
    return acc
  }, {})

  // Map scheduled tasks to their time slots
  const scheduledBySlot = {}
  scheduledTasks.forEach(task => {
    const slotIndex = timeToSlotIndex(task.scheduledTime)
    if (slotIndex >= 0) {
      scheduledBySlot[TIME_SLOTS[slotIndex].id] = task
    }
  })

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <main style={styles.main}>
        <div style={styles.splitContainer}>
          {/* Left Panel - Task List */}
          <TaskListDropZone id="task-list-drop">
            <div style={styles.leftPanel}>
              <header style={styles.header}>
                <h1 style={styles.title}>Tasks</h1>
                <p style={styles.subtitle}>
                  {unscheduledTasks.length} unscheduled · {scheduledTasks.length} scheduled · {completedTasks.length} done
                </p>
              </header>

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

              <div style={styles.taskLists}>
                {DUE_OPTIONS.map((option) => {
                  const categoryTasks = groupedTasks[option.id]
                  if (categoryTasks.length === 0) return null

                  return (
                    <section key={option.id} style={styles.section}>
                      <h2 style={styles.sectionTitle}>{option.label}</h2>
                      <div style={styles.taskList}>
                        {categoryTasks.map((task, index) => (
                          <DraggableTask
                            key={task.id}
                            task={task}
                            option={option}
                            onToggle={() => toggleComplete(task.id)}
                            onDelete={() => deleteTask(task.id)}
                            index={index}
                            onAddSubStep={(text) => addSubStep(task.id, text)}
                            onToggleSubStep={(stepId) => toggleSubStep(task.id, stepId)}
                            onDeleteSubStep={(stepId) => deleteSubStep(task.id, stepId)}
                          />
                        ))}
                      </div>
                    </section>
                  )
                })}

                {completedTasks.length > 0 && (
                  <section style={styles.section}>
                    <h2 style={{ ...styles.sectionTitle, color: 'rgba(0,0,0,0.4)' }}>Completed</h2>
                    <div style={styles.taskList}>
                      {completedTasks.map((task, index) => (
                        <TaskBar
                          key={task.id}
                          task={task}
                          option={getDueOption(task.due)}
                          onToggle={() => toggleComplete(task.id)}
                          onDelete={() => deleteTask(task.id)}
                          completed
                          index={index}
                          onAddSubStep={(text) => addSubStep(task.id, text)}
                          onToggleSubStep={(stepId) => toggleSubStep(task.id, stepId)}
                          onDeleteSubStep={(stepId) => deleteSubStep(task.id, stepId)}
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
          </TaskListDropZone>

          {/* Right Panel - Day Grid */}
          <div style={styles.rightPanel}>
            <header style={styles.gridHeader}>
              <h2 style={styles.gridTitle}>Day Schedule</h2>
              <p style={styles.gridSubtitle}>Drag tasks here to schedule</p>
            </header>
            <div style={styles.dayGrid}>
              {TIME_SLOTS.map((slot) => (
                <DroppableSlot
                  key={slot.id}
                  slot={slot}
                  scheduledTask={scheduledBySlot[slot.id]}
                  getDueOption={getDueOption}
                  onToggleTask={toggleComplete}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <DragOverlay>
        {activeTask && (
          <div style={styles.dragOverlay}>
            <div style={{
              ...styles.taskBar,
              background: getDueOption(activeTask.due)?.gradient || 'rgba(0,0,0,0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              transform: 'scale(1.02)',
            }}>
              <span style={styles.taskText}>{activeTask.text}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Drop zone for returning tasks to the list
function TaskListDropZone({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div ref={setNodeRef} style={{
      flex: 1,
      background: isOver ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
      transition: 'background 0.2s ease',
    }}>
      {children}
    </div>
  )
}

function TaskBar({ task, option, onToggle, onDelete, completed, index, onAddSubStep, onToggleSubStep, onDeleteSubStep, dragHandleProps }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newStepText, setNewStepText] = useState('')

  const isProject = task.due === 'project'
  const subSteps = task.subSteps || []
  const completedSteps = subSteps.filter(s => s.completed).length

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isDateReached = task.due === 'exact' && task.exactDateRaw ? task.exactDateRaw <= todayStr : false

  const orangeGradient = 'linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #c2410c 100%)'
  const orangeGlow = 'rgba(234, 88, 12, 0.45)'

  const displayGradient = isDateReached ? orangeGradient : option?.gradient
  const displayGlow = isDateReached ? orangeGlow : option?.glow

  const handleAddStep = (e) => {
    e.preventDefault()
    onAddSubStep(newStepText)
    setNewStepText('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div
        style={{
          ...styles.taskBar,
          background: completed ? 'rgba(0,0,0,0.03)' : displayGradient,
          opacity: completed ? 0.5 : 1,
          boxShadow: completed
            ? 'none'
            : isHovered
              ? `0 8px 40px ${displayGlow}, 0 0 0 1px rgba(255,255,255,0.1)`
              : `0 4px 20px ${displayGlow}`,
          transform: isHovered && !completed ? 'translateX(4px)' : 'translateX(0)',
          animationDelay: `${index * 50}ms`,
          borderRadius: isExpanded && isProject ? '16px 16px 0 0' : '16px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag Handle */}
        {dragHandleProps && !completed && (
          <button {...dragHandleProps} style={styles.dragHandle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="2" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="18" r="2" />
              <circle cx="15" cy="18" r="2" />
            </svg>
          </button>
        )}

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
          {task.exactDateDisplay && !completed && (
            <span style={styles.dateLabel}>{task.exactDateDisplay}</span>
          )}
          {task.scheduledTime && !completed && (
            <span style={styles.timeScheduledLabel}>
              {formatTimeDisplay(task.scheduledTime)}
            </span>
          )}
          {isProject && subSteps.length > 0 && (
            <span style={styles.stepCount}>{completedSteps}/{subSteps.length} steps</span>
          )}
        </div>

        {isProject && !completed && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              ...styles.expandButton,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}

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

      {isProject && isExpanded && !completed && (
        <div style={styles.subStepsPanel}>
          {subSteps.map((step) => (
            <div key={step.id} style={styles.subStepItem}>
              <button
                onClick={() => onToggleSubStep(step.id)}
                style={{
                  ...styles.subStepCheckbox,
                  background: step.completed ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
                  borderColor: step.completed ? 'rgba(124, 58, 237, 0.5)' : 'rgba(0,0,0,0.2)',
                }}
              >
                {step.completed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
              <span style={{
                ...styles.subStepText,
                textDecoration: step.completed ? 'line-through' : 'none',
                opacity: step.completed ? 0.5 : 1,
              }}>
                {step.text}
              </span>
              <button onClick={() => onDeleteSubStep(step.id)} style={styles.subStepDelete}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}

          <form onSubmit={handleAddStep} style={styles.addStepForm}>
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add a step..."
              style={styles.addStepInput}
            />
            <button type="submit" style={styles.addStepButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':').map(Number)
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  const ampm = hours >= 12 ? 'PM' : 'AM'
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

const styles = {
  main: {
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
  },
  splitContainer: {
    display: 'flex',
    minHeight: '100vh',
  },
  leftPanel: {
    width: '320px',
    minWidth: '280px',
    padding: '20px 15px 60px',
    overflowY: 'auto',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    minWidth: '400px',
    borderLeft: '2px solid rgba(0,0,0,0.15)',
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
  },
  gridHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  gridTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  gridSubtitle: {
    fontSize: '0.8rem',
    color: 'rgba(0,0,0,0.4)',
    margin: '4px 0 0 0',
  },
  dayGrid: {
    flex: 1,
    overflowY: 'auto',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },
  timeSlot: {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '12px',
    position: 'relative',
    transition: 'background 0.15s ease',
  },
  timeLabel: {
    fontSize: '0.75rem',
    fontFamily: "'Space Mono', monospace",
    width: '85px',
    flexShrink: 0,
  },
  scheduledTask: {
    position: 'absolute',
    top: 0,
    left: '100px',
    right: '8px',
    height: '54px',
    borderRadius: '8px',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    zIndex: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  scheduledTaskText: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  scheduledCheckbox: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    border: '2px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    marginRight: '8px',
    transition: 'all 0.2s ease',
  },
  header: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'rgba(0,0,0,0.4)',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.03em',
  },
  form: {
    marginBottom: '32px',
  },
  inputRow: {
    marginBottom: '12px',
  },
  textInput: {
    width: '100%',
    padding: '16px 20px',
    fontSize: '1rem',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    color: '#111827',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  dueSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  dueButton: {
    padding: '8px 12px',
    fontSize: '0.7rem',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    color: '#111827',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: '1 1 auto',
    minWidth: '80px',
  },
  dateInputWrapper: {
    marginBottom: '12px',
  },
  dateInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.95rem',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    color: '#111827',
    outline: 'none',
    colorScheme: 'light',
  },
  addButton: {
    width: '100%',
    padding: '14px',
    fontSize: '0.95rem',
    fontWeight: '600',
    background: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    color: '#111827',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  taskLists: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  section: {},
  sectionTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(0,0,0,0.5)',
    marginBottom: '12px',
    fontFamily: "'Space Mono', monospace",
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  taskBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '12px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'slideIn 0.3s ease forwards',
  },
  dragHandle: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8px',
    flexShrink: 0,
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
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
    marginLeft: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },
  taskText: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dateLabel: {
    fontSize: '0.7rem',
    fontFamily: "'Space Mono', monospace",
    background: 'rgba(0,0,0,0.2)',
    padding: '3px 8px',
    borderRadius: '5px',
    flexShrink: 0,
    color: '#fff',
  },
  timeScheduledLabel: {
    fontSize: '0.7rem',
    fontFamily: "'Space Mono', monospace",
    background: 'rgba(255,255,255,0.25)',
    padding: '3px 8px',
    borderRadius: '5px',
    flexShrink: 0,
    color: '#fff',
  },
  deleteButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '10px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyText: {
    fontSize: '1.2rem',
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
    marginBottom: '8px',
  },
  emptyHint: {
    fontSize: '0.9rem',
    color: 'rgba(0,0,0,0.2)',
  },
  stepCount: {
    fontSize: '0.7rem',
    fontFamily: "'Space Mono', monospace",
    background: 'rgba(0,0,0,0.2)',
    padding: '3px 8px',
    borderRadius: '5px',
    flexShrink: 0,
    color: '#fff',
  },
  expandButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(0,0,0,0.15)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  subStepsPanel: {
    background: '#fff',
    borderRadius: '0 0 16px 16px',
    padding: '12px 20px',
    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)',
    borderTop: '1px solid rgba(124, 58, 237, 0.1)',
  },
  subStepItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  subStepCheckbox: {
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '2px solid',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7c3aed',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  subStepText: {
    flex: 1,
    marginLeft: '10px',
    fontSize: '0.9rem',
    color: '#111827',
  },
  subStepDelete: {
    width: '24px',
    height: '24px',
    borderRadius: '5px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(0,0,0,0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  addStepForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '10px',
  },
  addStepInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.85rem',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    color: '#111827',
    outline: 'none',
  },
  addStepButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  dragOverlay: {
    width: '300px',
  },
}
