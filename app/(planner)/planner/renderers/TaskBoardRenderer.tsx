"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, User, Users as UsersIcon, Check, 
  CheckCircle2, Circle, Clock, Sparkles,
  Calendar, ListTodo, Zap, Target, MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { type RendererWithAllPagesProps, type Task } from "./types";
import { SUGGESTED_TASKS_BY_CATEGORY, RelatedTemplates } from "./shared";

// ============================================================================
// CONSTANTS
// ============================================================================
const TASK_COLORS: Record<Task["color"], { dot: string; bg: string; text: string }> = {
  yellow: { dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  pink: { dot: "bg-rose-400", bg: "bg-rose-50", text: "text-rose-700" },
  blue: { dot: "bg-sky-400", bg: "bg-sky-50", text: "text-sky-700" },
  green: { dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  purple: { dot: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
};

const STATUS_CONFIG = {
  todo: { 
    label: "To Do", 
    icon: Circle, 
    color: "text-warm-500",
    bg: "bg-warm-50",
    border: "border-warm-200",
    header: "bg-warm-100",
  },
  "in-progress": { 
    label: "In Progress", 
    icon: Clock, 
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    header: "bg-blue-100",
  },
  done: { 
    label: "Done", 
    icon: CheckCircle2, 
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    header: "bg-green-100",
  },
};

// ============================================================================
// TASK CARD COMPONENT (Extracted and memoized)
// ============================================================================
interface TaskCardProps {
  task: Task;
  partner1Name: string;
  partner2Name: string;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, status: Task["status"]) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  partner1Name,
  partner2Name,
  onUpdate,
  onDelete,
  onMove,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  
  const colors = TASK_COLORS[task.color];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "done";
  const isDueSoon = task.dueDate && !isOverdue && task.status !== "done";

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
      case "both": return "★";
      default: return "?";
    }
  };

  const handleSaveTitle = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, { title: trimmed });
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditValue(task.title);
    setIsEditing(true);
  };

  return (
    <div className="group bg-white rounded-lg border border-warm-200 hover:border-warm-300 hover:shadow-sm transition-all">
      <div className={`h-1 ${colors.dot} rounded-t-lg`} />
      
      <div className="p-3">
        <div className="flex items-start gap-2">
          <button
            onClick={() => onMove(task.id, task.status === "done" ? "todo" : "done")}
            className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              task.status === "done"
                ? "bg-green-500 border-green-500 text-white"
                : "border-warm-300 hover:border-green-400"
            }`}
          >
            {task.status === "done" && <Check className="w-2.5 h-2.5" />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditValue(task.title);
                    setIsEditing(false);
                  }
                }}
                className="w-full text-sm bg-warm-50 border border-warm-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                autoFocus
              />
            ) : (
              <p
                onClick={handleStartEdit}
                className={`text-sm cursor-text ${
                  task.status === "done" ? "line-through text-warm-400" : "text-warm-800"
                }`}
              >
                {task.title}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-warm-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4 text-warm-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStartEdit}>
                Edit title
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onMove(task.id, "todo")}
                disabled={task.status === "todo"}
              >
                <Circle className="w-3 h-3 mr-2" /> Move to To Do
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onMove(task.id, "in-progress")}
                disabled={task.status === "in-progress"}
              >
                <Clock className="w-3 h-3 mr-2" /> Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onMove(task.id, "done")}
                disabled={task.status === "done"}
              >
                <CheckCircle2 className="w-3 h-3 mr-2" /> Move to Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(task.id)}>
                <Trash2 className="w-3 h-3 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:bg-warm-100 transition-colors ${
                task.assignee !== "unassigned" ? colors.text : "text-warm-400"
              }`}>
                {task.assignee === "both" ? (
                  <UsersIcon className="w-3 h-3" />
                ) : task.assignee !== "unassigned" ? (
                  <span className="w-4 h-4 rounded-full bg-warm-200 text-warm-600 text-[10px] flex items-center justify-center font-medium">
                    {getAssigneeInitial(task.assignee)}
                  </span>
                ) : (
                  <User className="w-3 h-3" />
                )}
                <span>{task.assignee === "unassigned" ? "Assign" : getAssigneeName(task.assignee)}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(["unassigned", "partner1", "partner2", "both"] as const).map((assignee) => (
                <DropdownMenuItem 
                  key={assignee} 
                  onClick={() => onUpdate(task.id, { assignee })}
                >
                  {assignee === "partner1" ? partner1Name :
                   assignee === "partner2" ? partner2Name :
                   assignee === "both" ? "Both" : "Unassigned"}
                  {task.assignee === assignee && <Check className="w-3 h-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
              isOverdue ? "bg-red-100 text-red-700" :
              isDueSoon ? "bg-amber-100 text-amber-700" :
              "bg-warm-100 text-warm-600"
            }`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-3 h-3 rounded-full ${colors.dot} hover:ring-2 hover:ring-offset-1 hover:ring-warm-300 transition-all`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-2">
              <div className="flex gap-1">
                {(["blue", "green", "purple", "pink", "yellow"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate(task.id, { color })}
                    className={`w-6 h-6 rounded-full ${TASK_COLORS[color].dot} ${
                      task.color === color ? "ring-2 ring-offset-1 ring-warm-400" : "hover:scale-110"
                    } transition-all`}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if the task itself changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.assignee === nextProps.task.assignee &&
    prevProps.task.color === nextProps.task.color &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.partner1Name === nextProps.partner1Name &&
    prevProps.partner2Name === nextProps.partner2Name
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TaskBoardRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  const partner1Name = (fields.partner1Name as string) || "Partner 1";
  const partner2Name = (fields.partner2Name as string) || "Partner 2";
  const tasks: Task[] = Array.isArray(fields.tasks) ? fields.tasks : [];

  // Use ref to always have access to latest tasks without causing re-renders
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // State
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<Task["assignee"]>("unassigned");
  const [newTaskColor, setNewTaskColor] = useState<Task["color"]>("blue");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<Task["assignee"] | "all">("all");
  const [mobileColumn, setMobileColumn] = useState<Task["status"]>("todo");

  // Budget suggestions
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const budgetItems = (budgetFields.items as Record<string, unknown>[]) || [];
  const budgetCategories = [...new Set(budgetItems.map(item => item.category as string).filter(Boolean))];

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

  // Calculations
  const calculations = useMemo(() => {
    const filtered = filterAssignee === "all" 
      ? tasks 
      : tasks.filter(t => t.assignee === filterAssignee);
    
    const todoTasks = filtered.filter(t => t.status === "todo");
    const inProgressTasks = filtered.filter(t => t.status === "in-progress");
    const doneTasks = filtered.filter(t => t.status === "done");
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const partner1Tasks = tasks.filter(t => t.assignee === "partner1" && t.status !== "done").length;
    const partner2Tasks = tasks.filter(t => t.assignee === "partner2" && t.status !== "done").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === "done") return false;
      return new Date(t.dueDate) < today;
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
  // STABLE HANDLERS - Use refs to avoid dependency on tasks
  // ============================================================================
  const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const currentTasks = tasksRef.current;
    const newTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    updateField("tasks", newTasks);
  }, [updateField]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const currentTasks = tasksRef.current;
    const newTasks = currentTasks.filter(t => t.id !== taskId);
    updateField("tasks", newTasks);
    toast.success("Task deleted");
  }, [updateField]);

  const handleMoveTask = useCallback((taskId: string, newStatus: Task["status"]) => {
    const currentTasks = tasksRef.current;
    const newTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    updateField("tasks", newTasks);
    if (newStatus === "done") {
      toast.success("Task completed! 🎉");
    }
  }, [updateField]);

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    
    const currentTasks = tasksRef.current;
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: "todo",
      color: newTaskColor,
      dueDate: newTaskDueDate || undefined,
    };
    
    updateField("tasks", [...currentTasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setShowAddTask(false);
    toast.success("Task added!");
  }, [newTaskTitle, newTaskAssignee, newTaskColor, newTaskDueDate, updateField]);

  const handleAddSuggestedTask = useCallback((title: string, category: string) => {
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue", "Catering": "green", "Photography": "purple",
      "Florist": "pink", "Music / DJ": "yellow",
    };
    const currentTasks = tasksRef.current;
    const newTask: Task = {
      id: generateId(),
      title,
      assignee: "unassigned",
      status: "todo",
      color: colorMap[category] || "blue",
    };
    updateField("tasks", [...currentTasks, newTask]);
    toast.success(`Added: ${title}`);
  }, [updateField]);

  const handleAddAllFromCategory = useCallback((category: string, categoryTasks: string[]) => {
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue", "Catering": "green", "Photography": "purple",
    };
    const currentTasks = tasksRef.current;
    const newTasks = categoryTasks.map(title => ({
      id: generateId(),
      title,
      assignee: "unassigned" as const,
      status: "todo" as const,
      color: colorMap[category] || "blue" as const,
    }));
    updateField("tasks", [...currentTasks, ...newTasks]);
    toast.success(`Added ${categoryTasks.length} tasks`);
  }, [updateField]);

  // Column component
  const Column = ({ status, columnTasks }: { status: Task["status"]; columnTasks: Task[] }) => {
    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;

    return (
      <div className="flex-1 min-w-[280px] flex flex-col">
        <div className={`${config.header} rounded-t-lg px-3 py-2.5 border ${config.border} border-b-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${config.color}`} />
              <span className="font-medium text-sm text-warm-800">{config.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {columnTasks.length}
              </span>
            </div>
          </div>
        </div>

        <div className={`flex-1 ${config.bg} rounded-b-lg p-2 border ${config.border} border-t-0 space-y-2 min-h-[300px]`}>
          {columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              partner1Name={partner1Name}
              partner2Name={partner2Name}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              onMove={handleMoveTask}
            />
          ))}
          
          {columnTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-warm-400">
              <StatusIcon className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs">No tasks</p>
            </div>
          )}

          {status === "todo" && (
            <button
              onClick={() => setShowAddTask(true)}
              className="w-full p-2 border border-dashed border-warm-300 rounded-lg text-warm-400 hover:border-violet-400 hover:text-violet-500 hover:bg-white transition-all text-sm flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          )}
        </div>
      </div>
    );
  };

  const getMobileColumnTasks = () => {
    switch (mobileColumn) {
      case "todo": return calculations.todoTasks;
      case "in-progress": return calculations.inProgressTasks;
      case "done": return calculations.doneTasks;
    }
  };

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
                  </Button>
                )}
                <Button onClick={() => setShowAddTask(true)} className="bg-violet-600 hover:bg-violet-700 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-rose-400" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500 truncate">{partner1Name}</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">{calculations.partner1Tasks}</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-sky-400" />
                  <p className="text-[10px] sm:text-xs tracking-wider uppercase text-warm-500 truncate">{partner2Name}</p>
                </div>
                <p className="text-xl sm:text-2xl font-light text-warm-800">{calculations.partner2Tasks}</p>
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

        {/* Filter Bar */}
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/50">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Tasks */}
          <div className="md:hidden space-y-2">
            {getMobileColumnTasks().map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                partner1Name={partner1Name}
                partner2Name={partner2Name}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onMove={handleMoveTask}
              />
            ))}
            {getMobileColumnTasks().length === 0 && (
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
          <div className="hidden md:flex gap-4">
            <Column status="todo" columnTasks={calculations.todoTasks} />
            <Column status="in-progress" columnTasks={calculations.inProgressTasks} />
            <Column status="done" columnTasks={calculations.doneTasks} />
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
                placeholder="e.g., Book photographer"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
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
                        ? "border-violet-500 bg-violet-50 text-violet-700"
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
                <Label className="text-sm text-warm-600">Due Date</Label>
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
                      className={`w-7 h-7 rounded-full transition-all ${TASK_COLORS[color].dot} ${
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
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
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
                <p className="text-sm text-warm-400 mt-1">Add vendors to your budget first!</p>
              </div>
            ) : (
              suggestedTasks.map(({ category, tasks: categoryTasks }) => (
                <div key={category} className="border border-warm-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-warm-50">
                    <h4 className="font-medium text-warm-700">{category}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddAllFromCategory(category, categoryTasks)}
                      className="text-xs h-7 text-violet-600"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add All
                    </Button>
                  </div>
                  <div className="divide-y divide-warm-100">
                    {categoryTasks.map((task) => (
                      <div key={task} className="flex items-center justify-between px-4 py-2.5 hover:bg-warm-50 group">
                        <span className="text-sm text-warm-600">{task}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSuggestedTask(task, category)}
                          className="opacity-0 group-hover:opacity-100 h-7 px-2 text-violet-600"
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
