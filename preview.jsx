import { useState } from 'react';

const DUE_OPTIONS = [
  { id: 'today', label: 'Today', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)', glow: 'rgba(185, 28, 28, 0.4)' },
  { id: 'tomorrow', label: 'Tomorrow', gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 50%, #831843 100%)', glow: 'rgba(219, 39, 119, 0.4)' },
  { id: 'exact', label: 'Exact Date', gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)', glow: 'rgba(37, 99, 235, 0.4)' },
  { id: 'later', label: 'For Later', gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)', glow: 'rgba(22, 163, 74, 0.4)' },
];

const SAMPLE_TASKS = [
  { id: 1, text: 'Review quarterly report', due: 'today', completed: false },
  { id: 2, text: 'Schedule team standup', due: 'today', completed: false },
  { id: 3, text: 'Send project proposal', due: 'tomorrow', completed: false },
  { id: 4, text: 'Doctor appointment', due: 'exact', exactDate: '2025-01-20', completed: false },
  { id: 5, text: 'Learn a new recipe', due: 'later', completed: false },
  { id: 6, text: 'Morning meditation', due: 'today', completed: true },
];

export default function TodoApp() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [newTask, setNewTask] = useState('');
  const [selectedDue, setSelectedDue] = useState('today');
  const [exactDate, setExactDate] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    if (selectedDue === 'exact' && !exactDate) return;

    const task = {
      id: Date.now(),
      text: newTask.trim(),
      due: selectedDue,
      exactDate: selectedDue === 'exact' ? exactDate : null,
      completed: false,
    };

    setTasks([task, ...tasks]);
    setNewTask('');
    setExactDate('');
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getDueOption = (dueId) => DUE_OPTIONS.find(d => d.id === dueId);

  const formatExactDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const groupedTasks = DUE_OPTIONS.reduce((acc, option) => {
    acc[option.id] = tasks.filter(t => t.due === option.id && !t.completed);
    return acc;
  }, {});

  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ 
      background: '#0a0a0f',
      fontFamily: "'Outfit', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .task-bar { animation: slideIn 0.3s ease forwards; }
        
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(255,255,255,0.3) !important; background: rgba(255,255,255,0.08) !important; }
        
        .add-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .delete-btn:hover { background: rgba(255,255,255,0.2) !important; }
      `}</style>
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(255, 65, 108, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(17, 153, 142, 0.03) 0%, transparent 70%)
        `
      }} />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2" style={{
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Tasks
          </h1>
          <p className="text-sm tracking-widest" style={{ 
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Space Mono', monospace" 
          }}>
            {tasks.filter(t => !t.completed).length} active · {completedTasks.length} done
          </p>
        </header>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-12">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full p-5 text-lg rounded-2xl mb-4 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {DUE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedDue(option.id)}
                className="p-4 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: selectedDue === option.id ? option.gradient : 'rgba(255,255,255,0.05)',
                  boxShadow: selectedDue === option.id ? `0 4px 20px ${option.glow}` : 'none',
                  transform: selectedDue === option.id ? 'scale(1.02)' : 'scale(1)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {selectedDue === 'exact' && (
            <input
              type="date"
              value={exactDate}
              onChange={(e) => setExactDate(e.target.value)}
              className="w-full p-4 rounded-xl mb-4 outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                colorScheme: 'dark',
              }}
            />
          )}

          <button
            type="submit"
            className="add-btn w-full p-4 rounded-xl font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
            }}
          >
            Add Task
          </button>
        </form>

        {/* Task Lists */}
        <div className="space-y-10">
          {DUE_OPTIONS.map((option) => {
            const categoryTasks = groupedTasks[option.id];
            if (categoryTasks.length === 0) return null;

            return (
              <section key={option.id}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ 
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: "'Space Mono', monospace"
                }}>
                  {option.label}
                </h2>
                <div className="space-y-3">
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
            );
          })}

          {completedTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ 
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'Space Mono', monospace"
              }}>
                Completed
              </h2>
              <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );
}

function TaskBar({ task, option, onToggle, onDelete, formatExactDate, completed, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="task-bar flex items-center p-5 rounded-2xl transition-all duration-200"
      style={{
        background: completed ? 'rgba(255,255,255,0.03)' : option.gradient,
        opacity: completed ? 0.5 : 1,
        boxShadow: completed ? 'none' : isHovered ? `0 8px 40px ${option.glow}` : `0 4px 20px ${option.glow}`,
        transform: isHovered && !completed ? 'translateX(4px)' : 'translateX(0)',
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onToggle}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{
          background: completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
          border: completed ? 'none' : '2px solid rgba(255,255,255,0.3)',
          color: '#fff',
        }}
      >
        {completed && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-1 ml-4 flex items-center gap-3 min-w-0">
        <span className="text-lg font-medium text-white truncate" style={{
          textDecoration: completed ? 'line-through' : 'none',
        }}>
          {task.text}
        </span>
        {task.exactDate && !completed && (
          <span className="text-xs px-2.5 py-1 rounded-md shrink-0" style={{
            fontFamily: "'Space Mono', monospace",
            background: 'rgba(0,0,0,0.2)',
            color: '#fff',
          }}>
            {formatExactDate(task.exactDate)}
          </span>
        )}
      </div>

      <button
        onClick={onDelete}
        className="delete-btn w-9 h-9 rounded-lg flex items-center justify-center ml-3 shrink-0 transition-all"
        style={{
          background: 'rgba(0,0,0,0.2)',
          border: 'none',
          color: '#fff',
          opacity: isHovered || completed ? 1 : 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
