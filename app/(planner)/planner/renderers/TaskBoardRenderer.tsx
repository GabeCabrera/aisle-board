"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, User, Users as UsersIcon, Check, 
  ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Sparkles,
  Calendar, ListTodo, Zap, Target
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type RendererWithAllPagesProps, type Task } from "./types";
import { SUGGESTED_TASKS_BY_CATEGORY, RelatedTemplates } from "./shared";

// ============================================================================
// TASK COLORS - More subtle, professional palette
// ============================================================================
const TASK_COLORS: Record<Task["color"], { bg: string; border: string; text: string; dot: string }> = {
  yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
  pink: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-400" },
  blue: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", dot: "bg-sky-400" },
  green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
  purple: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-400" },
};

const STATUS_CONFIG = {
  todo: { 
    label: "To Do", 
    icon: Circle, 
    color: "text-warm-500",
    bg: "bg-warm-100",
    headerBg: "bg-gradient-to-r from-warm-100 to-warm-50",
  },
  "in-progress": { 
    label: "In Progress", 
    icon: Clock, 
    color: "text-amber-600",
    bg: "bg-amber-100",
    headerBg: "bg-gradient-to-r from-amber-100 to-amber-50",
  },
  done: { 
    label: "Done", 
    icon: CheckCircle2, 
    color: "text-green-600",
    bg: "bg-green-100",
    headerBg: "bg-gradient-to-r from-green-100 to-green-50",
  },
};

// ============================================================================
// TASK CARD COMPONENT (Memoized and extracted)
// ============================================================================
interface TaskCardProps {
  task: Task;
  isMobile?: boolean;
  isDragging: boolean;
  isExpanded: boolean;
  partner1Name: string;
  partner2Name: string;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, status: Task["status"]) => void;
  onToggleExpand: (taskId: string | null) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  isMobile = false,
  isDragging,
  isExpanded,
  partner1Name,
  partner2Name,
  onDragStart,
  onDragEnd,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onToggleExpand,
}: TaskCardProps) {
  const colors = TASK_COLORS[task.color];
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const isDueSoon = task.dueDate && !isOverdue && task.status !== "done" && 
    new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getAssigneeName = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1": return partner1Name;
      case "partner2": return partner2Name;
      case "both": return "Both";
      default: return "Unassigned";
    }
  };

  const getAssigneeInitial = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1": return partner1Name.charAt(0).toUpperCase();
      case "partner2": return partner2Name.charAt(0).toUpperCase();
      case "both": return "2";
      default: return "?";
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isMobile || isEditing) {
      e.preventDefault();
      return;
    }
    // Set drag image
    const dragElement = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(dragElement, dragElement.offsetWidth / 2, 20);
    onDragStart(e, task.id);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() !== task.title) {
      onUpdateTask(task.id, { title: editTitle.trim() || task.title });
    }
    setIsEditing(false);
  };

  return (
    <div
      draggable={!isMobile && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        group relative rounded-xl border-2 transition-all duration-200
        ${colors.bg} ${colors.border}
        ${isDragging ? 'opacity-50 scale-[1.02] shadow-lg z-50' : 'hover:shadow-md'}
        ${!isMobile && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* Color indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-[10px] ${colors.dot}`} />

      <div className="p-4 pt-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Checkbox / Status indicator */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveTask(task.id, task.status !== "done" ? "done" : "todo");
            }}
            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === "done" 
                ? "bg-green-500 border-green-500 text-white" 
                : "border-warm-300 hover:border-green-400 hover:bg-green-50"
            }`}
          >
            {task.status === "done" && <Check className="w-3 h-3" />}
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setEditTitle(task.title);
                    setIsEditing(false);
                  }
                }}
                className="w-full bg-white/50 border border-warm-200 rounded px-2 py-1 text-sm font-medium text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTitle(task.title);
                  setIsEditing(true);
                }}
                className={`font-medium text-warm-800 cursor-text leading-snug ${
                  task.status === "done" ? "line-through text-warm-400" : ""
                }`}
              >
                {task.title}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Assignee badge */}
              {task.assignee !== "unassigned" && (
                <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {task.assignee === "both" ? (
                    <UsersIcon className="w-3 h-3" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-warm-200 text-warm-600 text-[10px] flex items-center justify-center font-medium">
                      {getAssigneeInitial(task.assignee)}
                    </span>
                  )}
                  <span>{getAssigneeName(task.assignee)}</span>
                </div>
              )}

              {/* Due date */}
              {task.dueDate && (
                <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  isOverdue ? "bg-red-100 text-red-700" :
                  isDueSoon ? "bg-amber-100 text-amber-700" :
                  "bg-warm-100 text-warm-600"
                }`}>
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isMobile ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(isExpanded ? null : task.id);
                }}
                className="p-1.5 rounded-lg hover:bg-white/50 text-warm-400"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-100 text-warm-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded actions (mobile) */}
        {isMobile && isExpanded && (
          <div className="mt-4 pt-3 border-t border-warm-200/50 space-y-3">
            {/* Assignee */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-500 w-16">Assign to</Label>
              <div className="flex-1 flex gap-1">
                {(["unassigned", "partner1", "partner2", "both"] as const).map((assignee) => (
                  <button
                    key={assignee}
                    onClick={() => onUpdateTask(task.id, { assignee })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      task.assignee === assignee
                        ? "border-warm-500 bg-warm-100 text-warm-700"
                        : "border-warm-200 bg-white text-warm-500 hover:border-warm-300"
                    }`}
                  >
                    {assignee === "partner1" ? partner1Name.split(" ")[0] :
                     assignee === "partner2" ? partner2Name.split(" ")[0] :
                     assignee === "both" ? "Both" : "None"}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-500 w-16">Due</Label>
              <Input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value || undefined })}
                className="flex-1 text-xs h-8"
              />
            </div>

            {/* Color */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-500 w-16">Color</Label>
              <div className="flex gap-2">
                {(["blue", "green", "purple", "pink", "yellow"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateTask(task.id, { color })}
                    className={`w-7 h-7 rounded-full transition-all ${TASK_COLORS[color].dot} ${
                      task.color === color ? "ring-2 ring-offset-2 ring-warm-400 scale-110" : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Move / Delete buttons */}
            <div className="flex gap-2 pt-2">
              {task.status !== "todo" && (
                <Button variant="outline" size="sm" onClick={() => onMoveTask(task.id, "todo")} className="flex-1 text-xs h-8">
                  To Do
                </Button>
              )}
              {task.status !== "in-progress" && (
                <Button variant="outline" size="sm" onClick={() => onMoveTask(task.id, "in-progress")} className="flex-1 text-xs h-8">
                  <Clock className="w-3 h-3 mr-1" />
                  In Progress
                </Button>
              )}
              {task.status !== "done" && (
                <Button size="sm" onClick={() => onMoveTask(task.id, "done")} className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700">
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete Task
            </Button>
          </div>
        )}
      </div>

      {/* Desktop quick actions bar */}
      {!isMobile && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/80 to-transparent rounded-b-xl flex items-end justify-between px-3 pb-2">
          {/* Color picker */}
          <div className="flex gap-1">
            {(["blue", "green", "purple", "pink", "yellow"] as const).map((color) => (
              <button
                key={color}
                onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { color }); }}
                className={`w-4 h-4 rounded-full transition-all ${TASK_COLORS[color].dot} ${
                  task.color === color ? "ring-2 ring-offset-1 ring-warm-400" : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          {/* Status buttons */}
          <div className="flex gap-1">
            {task.status !== "todo" && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, "todo"); }}
                className="px-2 py-1 text-xs bg-warm-200 hover:bg-warm-300 rounded text-warm-600 transition-colors"
              >
                To Do
              </button>
            )}
            {task.status !== "in-progress" && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, "in-progress"); }}
                className="px-2 py-1 text-xs bg-amber-200 hover:bg-amber-300 rounded text-amber-700 transition-colors"
              >
                Progress
              </button>
            )}
            {task.status !== "done" && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, "done"); }}
                className="px-2 py-1 text-xs bg-green-200 hover:bg-green-300 rounded text-green-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TaskBoardRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  const partner1Name = (fields.partner1Name as string) || "Partner 1";
  const partner2Name = (fields.partner2Name as string) || "Partner 2";
  const tasks = (fields.tasks as Task[]) || [];

  // State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<Task["assignee"]>("unassigned");
  const [newTaskColor, setNewTaskColor] = useState<Task["color"]>("blue");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<Task["assignee"] | "all">("all");
  const [mobileColumn, setMobileColumn] = useState<Task["status"]>("todo");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Get budget categories from budget page for suggestions
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const budgetItems = (budgetFields.items as Record<string, unknown>[]) || [];
  const budgetCategories = [...new Set(budgetItems.map(item => item.category as string).filter(Boolean))];

  // Get suggested tasks
  const suggestedTasks = useMemo(() => {
    const suggestions: { category: string; tasks: string[] }[] = [];
    const existingTaskTitles = tasks.map(t => t.title.toLowerCase());
    
    budgetCategories.forEach(category => {
      const categoryTasks = SUGGESTED_TASKS_BY_CATEGORY[category] || [];
      const newSuggestions = categoryTasks.filter(
        task => !existingTaskTitles.includes(task.toLowerCase())
      );
      if (newSuggestions.length > 0) {
        suggestions.push({ category, tasks: newSuggestions });
      }
    });
    
    return suggestions;
  }, [tasks, budgetCategories]);

  const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ============================================================================
  // CALCULATIONS
  // ============================================================================
  const calculations = useMemo(() => {
    const todoTasks = tasks.filter(t => t.status === "todo" && (filterAssignee === "all" || t.assignee === filterAssignee));
    const inProgressTasks = tasks.filter(t => t.status === "in-progress" && (filterAssignee === "all" || t.assignee === filterAssignee));
    const doneTasks = tasks.filter(t => t.status === "done" && (filterAssignee === "all" || t.assignee === filterAssignee));
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const partner1Tasks = tasks.filter(t => t.assignee === "partner1" && t.status !== "done").length;
    const partner2Tasks = tasks.filter(t => t.assignee === "partner2" && t.status !== "done").length;

    // Tasks with due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === "done") return false;
      const due = new Date(t.dueDate);
      return due < today;
    });
    const dueSoonTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === "done") return false;
      const due = new Date(t.dueDate);
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due >= today && due <= weekFromNow;
    });

    return {
      todoTasks,
      inProgressTasks,
      doneTasks,
      totalTasks,
      completedTasks,
      completionPercent,
      partner1Tasks,
      partner2Tasks,
      overdueTasks,
      dueSoonTasks,
    };
  }, [tasks, filterAssignee]);

  // ============================================================================
  // HANDLERS (memoized with useCallback)
  // ============================================================================
  const addTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: "todo",
      color: newTaskColor,
      dueDate: newTaskDueDate || undefined,
    };
    
    updateField("tasks", [...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setShowAddTask(false);
    toast.success("Task added!");
  }, [newTaskTitle, newTaskAssignee, newTaskColor, newTaskDueDate, tasks, updateField]);

  const addSuggestedTask = useCallback((title: string, category: string) => {
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue",
      "Catering": "green",
      "Photography": "purple",
      "Videography": "purple",
      "Florist": "pink",
      "Music / DJ": "yellow",
      "Wedding Attire": "pink",
      "Hair & Makeup": "pink",
      "Invitations & Stationery": "yellow",
      "Wedding Cake": "green",
      "Decorations": "purple",
      "Transportation": "blue",
      "Officiant": "blue",
      "Wedding Rings": "yellow",
      "Favors & Gifts": "green",
      "Honeymoon": "blue",
    };

    const newTask: Task = {
      id: generateId(),
      title,
      assignee: "unassigned",
      status: "todo",
      color: colorMap[category] || "blue",
    };
    
    updateField("tasks", [...tasks, newTask]);
    toast.success(`Added: ${title}`);
  }, [tasks, updateField]);

  const addAllFromCategory = useCallback((category: string, categoryTasks: string[]) => {
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue",
      "Catering": "green",
      "Photography": "purple",
      "Videography": "purple",
      "Florist": "pink",
      "Music / DJ": "yellow",
    };

    const newTasks: Task[] = categoryTasks.map(title => ({
      id: generateId(),
      title,
      assignee: "unassigned" as const,
      status: "todo" as const,
      color: colorMap[category] || "blue",
    }));
    
    updateField("tasks", [...tasks, ...newTasks]);
    toast.success(`Added ${categoryTasks.length} tasks from ${category}`);
  }, [tasks, updateField]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    updateField("tasks", updated);
  }, [tasks, updateField]);

  const deleteTask = useCallback((taskId: string) => {
    updateField("tasks", tasks.filter(t => t.id !== taskId));
    toast.success("Task deleted");
  }, [tasks, updateField]);

  const moveTask = useCallback((taskId: string, newStatus: Task["status"]) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    updateField("tasks", updated);
    if (newStatus === "done") {
      toast.success("Task completed! 🎉");
    }
  }, [tasks, updateField]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, newStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, [moveTask]);

  const handleToggleExpand = useCallback((taskId: string | null) => {
    setExpandedTaskId(taskId);
  }, []);

  // ============================================================================
  // COLUMN COMPONENT
  // ============================================================================
  const Column = ({ status }: { status: Task["status"] }) => {
    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;
    const columnTasks = status === "todo" ? calculations.todoTasks : 
                        status === "in-progress" ? calculations.inProgressTasks : 
                        calculations.doneTasks;
    const isDropTarget = dragOverColumn === status;

    return (
      <div className="flex-1 min-w-[300px]">
        {/* Column Header */}
        <div className={`${config.headerBg} rounded-t-xl px-4 py-3 border border-b-0 border-warm-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${config.color}`} />
              <h3 className="font-medium text-warm-800">{config.label}</h3>
            </div>
            <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
              {columnTasks.length}
            </span>
          </div>
        </div>

        {/* Column Body */}
        <div 
          className={`
            bg-warm-50/50 rounded-b-xl p-3 min-h-[400px] space-y-3
            border border-t-0 border-warm-200
            transition-all duration-200
            ${isDropTarget ? 'bg-warm-100 ring-2 ring-violet-400 ring-inset' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {columnTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task}
              isDragging={draggedTaskId === task.id}
              isExpanded={expandedTaskId === task.id}
              partner1Name={partner1Name}
              partner2Name={partner2Name}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              onToggleExpand={handleToggleExpand}
            />
          ))}
          
          {columnTasks.length === 0 && (
            <div className={`text-center py-12 ${isDropTarget ? '' : 'opacity-50'}`}>
              <StatusIcon className={`w-8 h-8 mx-auto mb-2 ${config.color}`} />
              <p className={`text-sm ${isDropTarget ? 'text-warm-600 font-medium' : 'text-warm-400'}`}>
                {isDropTarget ? 'Drop here!' : `No ${config.label.toLowerCase()} tasks`}
              </p>
            </div>
          )}

          {/* Add task button in To Do column */}
          {status === "todo" && (
            <button
              onClick={() => setShowAddTask(true)}
              className="w-full p-3 border-2 border-dashed border-warm-200 rounded-xl text-warm-400 hover:border-warm-300 hover:text-warm-500 hover:bg-white/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add task</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Get mobile column tasks
  const getMobileColumnTasks = () => {
    switch (mobileColumn) {
      case "todo": return calculations.todoTasks;
      case "in-progress": return calculations.inProgressTasks;
      case "done": return calculations.doneTasks;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-lg">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 md:p-10 border-b border-warm-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-100/30 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-light tracking-wide text-warm-800">
                  {page.title}
                </h2>
                <p className="text-warm-500 text-xs sm:text-sm mt-1">Stay organized, stay on track</p>
              </div>
              <div className="flex gap-2">
                {suggestedTasks.length > 0 && (
                  <Button variant="outline" onClick={() => setShowSuggestions(true)} size="sm" className="bg-white/70">
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                    <span className="hidden sm:inline">Suggestions</span>
                    <span className="sm:hidden">Ideas</span>
                  </Button>
                )}
                <Button onClick={() => setShowAddTask(true)} className="bg-violet-600 hover:bg-violet-700 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-violet-500" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500">Progress</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">{calculations.completionPercent}%</p>
                <div className="mt-2 h-1.5 bg-warm-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-500 rounded-full transition-all duration-500"
                    style={{ width: `${calculations.completionPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <ListTodo className="w-4 h-4 text-warm-500" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500">Tasks</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">
                  {calculations.completedTasks}<span className="text-lg text-warm-400">/{calculations.totalTasks}</span>
                </p>
                <p className="text-[10px] text-warm-400 mt-1">{calculations.totalTasks - calculations.completedTasks} remaining</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-rose-400" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500 truncate">{partner1Name}</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">{calculations.partner1Tasks}</p>
                <p className="text-[10px] text-warm-400 mt-1">tasks assigned</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-sky-400" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500 truncate">{partner2Name}</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">{calculations.partner2Tasks}</p>
                <p className="text-[10px] text-warm-400 mt-1">tasks assigned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(calculations.overdueTasks.length > 0 || calculations.dueSoonTasks.length > 0) && (
          <div className="px-6 md:px-10 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-4 text-sm">
              {calculations.overdueTasks.length > 0 && (
                <span className="flex items-center gap-1.5 text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {calculations.overdueTasks.length} overdue
                </span>
              )}
              {calculations.dueSoonTasks.length > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {calculations.dueSoonTasks.length} due this week
                </span>
              )}
            </div>
          </div>
        )}

        {/* Partner Names & Filter Bar */}
        <div className="px-6 md:px-10 py-4 bg-warm-50/50 border-b border-warm-200">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                <User className="w-3 h-3 text-rose-500" />
              </div>
              <Input
                value={partner1Name === "Partner 1" ? "" : partner1Name}
                onChange={(e) => updateField("partner1Name", e.target.value || "Partner 1")}
                placeholder="Partner 1"
                className="w-24 sm:w-28 h-8 text-sm bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                <User className="w-3 h-3 text-sky-500" />
              </div>
              <Input
                value={partner2Name === "Partner 2" ? "" : partner2Name}
                onChange={(e) => updateField("partner2Name", e.target.value || "Partner 2")}
                placeholder="Partner 2"
                className="w-24 sm:w-28 h-8 text-sm bg-white"
              />
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-500">Show:</Label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value as Task["assignee"] | "all")}
                className="px-2 py-1.5 border border-warm-200 text-xs rounded-lg bg-white"
              >
                <option value="all">All Tasks</option>
                <option value="partner1">{partner1Name}</option>
                <option value="partner2">{partner2Name}</option>
                <option value="both">Both</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-10">
          {/* Mobile Column Selector */}
          <div className="md:hidden mb-4">
            <div className="flex rounded-xl overflow-hidden border border-warm-200 bg-white">
              {(["todo", "in-progress", "done"] as const).map((status) => {
                const config = STATUS_CONFIG[status];
                const StatusIcon = config.icon;
                const count = status === "todo" ? calculations.todoTasks.length :
                              status === "in-progress" ? calculations.inProgressTasks.length :
                              calculations.doneTasks.length;
                return (
                  <button
                    key={status}
                    onClick={() => setMobileColumn(status)}
                    className={`flex-1 py-3 px-2 text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                      mobileColumn === status
                        ? `${config.bg} ${config.color}`
                        : "text-warm-400 hover:bg-warm-50"
                    }`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span>{config.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      mobileColumn === status ? "bg-white/50" : "bg-warm-100"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Task List */}
          <div className="md:hidden space-y-3">
            {getMobileColumnTasks().length > 0 ? (
              getMobileColumnTasks().map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  isMobile
                  isDragging={false}
                  isExpanded={expandedTaskId === task.id}
                  partner1Name={partner1Name}
                  partner2Name={partner2Name}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onMoveTask={moveTask}
                  onToggleExpand={handleToggleExpand}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-warm-50 rounded-xl border border-dashed border-warm-200">
                <Circle className="w-8 h-8 mx-auto mb-2 text-warm-300" />
                <p className="text-sm text-warm-400">No tasks here</p>
              </div>
            )}
            
            {mobileColumn === "todo" && (
              <button
                onClick={() => setShowAddTask(true)}
                className="w-full p-4 border-2 border-dashed border-warm-200 rounded-xl text-warm-400 hover:border-violet-300 hover:text-violet-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add a task</span>
              </button>
            )}
          </div>

          {/* Desktop Columns */}
          <div className="hidden md:flex gap-6">
            <Column status="todo" />
            <Column status="in-progress" />
            <Column status="done" />
          </div>

          {/* Related Templates */}
          <div className="mt-8">
            <RelatedTemplates 
              templateIds={["budget", "vendor-contacts", "day-of-schedule"]} 
              allPages={allPages}
              title="Related"
            />
          </div>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-violet-600" />
              </div>
              <span>Add New Task</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm text-warm-600">What needs to be done?</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Book photographer, Send invitations"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-sm text-warm-600">Assign to</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {(["unassigned", "partner1", "partner2", "both"] as const).map((assignee) => (
                  <button
                    key={assignee}
                    onClick={() => setNewTaskAssignee(assignee)}
                    className={`px-2 py-2.5 border rounded-lg text-xs transition-all ${
                      newTaskAssignee === assignee
                        ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-500"
                        : "border-warm-200 hover:border-warm-300 text-warm-600"
                    }`}
                  >
                    {assignee === "partner1" ? partner1Name.split(" ")[0] :
                     assignee === "partner2" ? partner2Name.split(" ")[0] :
                     assignee === "both" ? "Both" : "Anyone"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-warm-600">Due Date (optional)</Label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm text-warm-600">Color</Label>
                <div className="flex gap-2 mt-2.5">
                  {(["blue", "green", "purple", "pink", "yellow"] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTaskColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${TASK_COLORS[color].dot} ${
                        newTaskColor === color ? "ring-2 ring-offset-2 ring-warm-400 scale-110" : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span>Task Suggestions</span>
                <p className="text-sm font-normal text-warm-500">Based on your vendors</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {suggestedTasks.length === 0 ? (
              <div className="text-center py-8 bg-warm-50 rounded-xl">
                <Zap className="w-10 h-10 mx-auto mb-3 text-warm-300" />
                <p className="text-warm-600 font-medium">No suggestions yet</p>
                <p className="text-sm text-warm-400 mt-1">Add vendors to your budget to get personalized task suggestions!</p>
              </div>
            ) : (
              suggestedTasks.map(({ category, tasks: categoryTasks }) => (
                <div key={category} className="border border-warm-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-warm-50">
                    <h4 className="font-medium text-warm-700">{category}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addAllFromCategory(category, categoryTasks)}
                      className="text-xs h-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add All
                    </Button>
                  </div>
                  <div className="divide-y divide-warm-100">
                    {categoryTasks.map((task) => (
                      <div
                        key={task}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-warm-50 group transition-colors"
                      >
                        <span className="text-sm text-warm-600">{task}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSuggestedTask(task, category)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-violet-600"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <Button variant="outline" onClick={() => setShowSuggestions(false)} className="w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
