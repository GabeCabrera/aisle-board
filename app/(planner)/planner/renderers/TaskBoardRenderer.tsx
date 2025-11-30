"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Star, GripVertical, User, Users as UsersIcon, Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type RendererWithAllPagesProps, type Task } from "./types";
import { POST_IT_COLORS, POST_IT_SHADOWS, SUGGESTED_TASKS_BY_CATEGORY } from "./shared";

export function TaskBoardRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  const partner1Name = (fields.partner1Name as string) || "Partner 1";
  const partner2Name = (fields.partner2Name as string) || "Partner 2";
  const tasks = (fields.tasks as Task[]) || [];

  // Memoize stable rotation values for each task to prevent jitter
  const taskRotations = useMemo(() => {
    const rotations: Record<string, number> = {};
    tasks.forEach(task => {
      if (!task.id) return;
      const hash = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      rotations[task.id] = ((hash % 100) - 50) / 50 * 2;
    });
    return rotations;
  }, [tasks]);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<Task["assignee"]>("unassigned");
  const [newTaskColor, setNewTaskColor] = useState<Task["color"]>("yellow");
  const [filterAssignee, setFilterAssignee] = useState<Task["assignee"] | "all">("all");
  const [mobileColumn, setMobileColumn] = useState<Task["status"]>("todo");

  // Get budget categories from budget page
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const budgetItems = (budgetFields.items as Record<string, unknown>[]) || [];
  const budgetCategories = [...new Set(budgetItems.map(item => item.category as string).filter(Boolean))];

  // Get suggested tasks based on budget categories
  const getSuggestedTasks = () => {
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
  };

  const suggestedTasks = getSuggestedTasks();

  const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === "todo" && (filterAssignee === "all" || t.assignee === filterAssignee));
  const inProgressTasks = tasks.filter(t => t.status === "in-progress" && (filterAssignee === "all" || t.assignee === filterAssignee));
  const doneTasks = tasks.filter(t => t.status === "done" && (filterAssignee === "all" || t.assignee === filterAssignee));

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: "todo",
      color: newTaskColor,
    };
    
    updateField("tasks", [...tasks, newTask]);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const addSuggestedTask = (title: string, category: string) => {
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
      color: colorMap[category] || "yellow",
    };
    
    updateField("tasks", [...tasks, newTask]);
    toast.success(`Added: ${title}`);
  };

  const addAllFromCategory = (category: string, categoryTasks: string[]) => {
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

    const newTasks: Task[] = categoryTasks.map(title => ({
      id: generateId(),
      title,
      assignee: "unassigned" as const,
      status: "todo" as const,
      color: colorMap[category] || "yellow",
    }));
    
    updateField("tasks", [...tasks, ...newTasks]);
    toast.success(`Added ${categoryTasks.length} tasks from ${category}`);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    updateField("tasks", updated);
  };

  const deleteTask = (taskId: string) => {
    updateField("tasks", tasks.filter(t => t.id !== taskId));
  };

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    updateTask(taskId, { status: newStatus });
  };

  const getAssigneeName = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1": return partner1Name;
      case "partner2": return partner2Name;
      case "both": return "Both";
      default: return "Unassigned";
    }
  };

  const getAssigneeIcon = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1":
      case "partner2":
        return <User className="w-3 h-3" />;
      case "both":
        return <UsersIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const partner1Tasks = tasks.filter(t => t.assignee === "partner1" && t.status !== "done").length;
  const partner2Tasks = tasks.filter(t => t.assignee === "partner2" && t.status !== "done").length;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && draggedTaskId) {
      moveTask(taskId, newStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Mobile Task Card Component
  const MobileTaskCard = ({ task }: { task: Task }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className={`p-3 rounded-lg border-2 ${POST_IT_COLORS[task.color]} mb-2`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm text-warm-800 truncate">{task.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {getAssigneeIcon(task.assignee)}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
        
        {expanded && (
          <div className="mt-3 pt-3 border-t border-warm-200/50 space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-600">Assignee:</Label>
              <select
                value={task.assignee}
                onChange={(e) => updateTask(task.id, { assignee: e.target.value as Task["assignee"] })}
                className="flex-1 text-xs bg-white/50 border border-warm-200 rounded px-2 py-1"
              >
                <option value="unassigned">Unassigned</option>
                <option value="partner1">{partner1Name}</option>
                <option value="partner2">{partner2Name}</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-warm-600">Color:</Label>
              <div className="flex gap-1">
                {(["yellow", "pink", "blue", "green", "purple"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateTask(task.id, { color })}
                    className={`w-6 h-6 rounded-full border-2 border-white shadow-sm ${
                      color === "yellow" ? "bg-yellow-300" :
                      color === "pink" ? "bg-pink-300" :
                      color === "blue" ? "bg-blue-300" :
                      color === "green" ? "bg-green-300" :
                      "bg-purple-300"
                    } ${task.color === color ? "ring-2 ring-warm-400" : ""}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              {task.status !== "todo" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveTask(task.id, "todo")}
                  className="flex-1 text-xs"
                >
                  To Do
                </Button>
              )}
              {task.status !== "in-progress" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveTask(task.id, "in-progress")}
                  className="flex-1 text-xs"
                >
                  In Progress
                </Button>
              )}
              {task.status !== "done" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveTask(task.id, "done")}
                  className="flex-1 text-xs bg-green-50"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteTask(task.id)}
              className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Desktop Post-it card component
  const PostItCard = ({ task }: { task: Task }) => {
    const isEditing = editingTask === task.id;
    const [editTitle, setEditTitle] = useState(task.title);
    const rotation = taskRotations[task.id] || 0;
    const isDragging = draggedTaskId === task.id;

    return (
      <div
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={`
          relative p-4 pb-10 border-2 rounded-sm
          ${POST_IT_COLORS[task.color]}
          shadow-md ${POST_IT_SHADOWS[task.color]}
          transition-all duration-200
          group
          ${isDragging ? 'opacity-50 scale-105' : ''}
          ${!isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{ 
          transform: `rotate(${rotation}deg)`,
          minHeight: '160px'
        }}
      >
        <div className="absolute top-1 right-1 text-warm-400 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-md hover:bg-red-600 z-10"
        >
          ×
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              updateTask(task.id, { title: editTitle });
              setEditingTask(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateTask(task.id, { title: editTitle });
                setEditingTask(null);
              }
            }}
            className="w-full bg-transparent border-none font-medium text-warm-800 focus:outline-none"
            autoFocus
          />
        ) : (
          <p
            onClick={() => setEditingTask(task.id)}
            className="font-medium text-warm-800 cursor-text min-h-[40px]"
          >
            {task.title}
          </p>
        )}

        <div className="mt-3 pt-2 border-t border-warm-200/50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-warm-600">
            {getAssigneeIcon(task.assignee)}
            <span>{getAssigneeName(task.assignee)}</span>
          </div>
        </div>

        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "todo" && (
            <button
              onClick={() => moveTask(task.id, "todo")}
              className="w-6 h-6 bg-warm-200 rounded text-warm-600 text-xs hover:bg-warm-300 flex items-center justify-center"
              title="Move to To Do"
            >
              ←
            </button>
          )}
          {task.status !== "in-progress" && (
            <button
              onClick={() => moveTask(task.id, "in-progress")}
              className="w-6 h-6 bg-amber-200 rounded text-amber-700 text-xs hover:bg-amber-300 flex items-center justify-center"
              title="Move to In Progress"
            >
              ●
            </button>
          )}
          {task.status !== "done" && (
            <button
              onClick={() => moveTask(task.id, "done")}
              className="w-6 h-6 bg-green-200 rounded text-green-700 text-xs hover:bg-green-300 flex items-center justify-center"
              title="Mark Done"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(["yellow", "pink", "blue", "green", "purple"] as const).map((color) => (
            <button
              key={color}
              onClick={() => updateTask(task.id, { color })}
              className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                color === "yellow" ? "bg-yellow-300" :
                color === "pink" ? "bg-pink-300" :
                color === "blue" ? "bg-blue-300" :
                color === "green" ? "bg-green-300" :
                "bg-purple-300"
              } ${task.color === color ? "ring-2 ring-warm-400" : ""}`}
            />
          ))}
        </div>

        <select
          value={task.assignee}
          onChange={(e) => updateTask(task.id, { assignee: e.target.value as Task["assignee"] })}
          className="absolute bottom-2 left-2 text-xs bg-white/50 border border-warm-200 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <option value="unassigned">Unassigned</option>
          <option value="partner1">{partner1Name}</option>
          <option value="partner2">{partner2Name}</option>
          <option value="both">Both</option>
        </select>
      </div>
    );
  };

  // Column component (Desktop)
  const Column = ({ 
    title, 
    tasks: columnTasks, 
    status, 
    headerColor 
  }: { 
    title: string; 
    tasks: Task[]; 
    status: Task["status"];
    headerColor: string;
  }) => {
    const isDropTarget = dragOverColumn === status;
    
    return (
      <div className="flex-1 min-w-[280px]">
        <div className={`${headerColor} rounded-t-lg px-4 py-3 flex items-center justify-between`}>
          <h3 className="font-medium text-warm-800">{title}</h3>
          <span className="text-sm text-warm-600 bg-white/50 px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <div 
          className={`
            bg-warm-100/50 rounded-b-lg p-4 min-h-[400px] space-y-4
            transition-colors duration-200
            ${isDropTarget ? 'bg-warm-200/70 ring-2 ring-warm-400 ring-inset' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {columnTasks.map((task) => (
            <PostItCard key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <p className={`text-center text-sm py-8 italic ${isDropTarget ? 'text-warm-600' : 'text-warm-400'}`}>
              {isDropTarget ? 'Drop here!' : 'No tasks here yet'}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Get current mobile column tasks
  const getMobileColumnTasks = () => {
    switch (mobileColumn) {
      case "todo": return todoTasks;
      case "in-progress": return inProgressTasks;
      case "done": return doneTasks;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-0">
      <div className="bg-white shadow-lg p-4 md:p-8 lg:p-12">
        {/* Page Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-3 md:mt-4" />
        </div>

        {/* Partner Names Setup */}
        <div className="mb-6 md:mb-8 p-4 md:p-6 bg-warm-50 border border-warm-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs md:text-sm text-warm-600 whitespace-nowrap">Partner 1:</Label>
              <Input
                value={partner1Name === "Partner 1" ? "" : partner1Name}
                onChange={(e) => updateField("partner1Name", e.target.value || "Partner 1")}
                placeholder="Partner 1"
                className="w-full sm:w-28 md:w-32 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs md:text-sm text-warm-600 whitespace-nowrap">Partner 2:</Label>
              <Input
                value={partner2Name === "Partner 2" ? "" : partner2Name}
                onChange={(e) => updateField("partner2Name", e.target.value || "Partner 2")}
                placeholder="Partner 2"
                className="w-full sm:w-28 md:w-32 text-sm"
              />
            </div>
            <div className="flex-1" />
            <div className="flex gap-2 w-full sm:w-auto">
              {suggestedTasks.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuggestions(true)}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs md:text-sm"
                >
                  <Star className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Suggestions</span>
                  <span className="sm:hidden">Ideas</span>
                </Button>
              )}
              <Button
                onClick={() => setShowAddTask(true)}
                className="flex-1 sm:flex-none bg-warm-600 hover:bg-warm-700 text-white text-xs md:text-sm"
                size="sm"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Stats & Filter */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto">
            <div className="text-center flex-shrink-0">
              <p className="text-xl md:text-2xl font-light text-warm-700">{totalTasks}</p>
              <p className="text-[9px] md:text-xs tracking-wider uppercase text-warm-500">Total</p>
            </div>
            <div className="h-6 md:h-8 w-px bg-warm-200 flex-shrink-0" />
            <div className="text-center flex-shrink-0">
              <p className="text-lg md:text-xl font-light text-green-600">{completedTasks}</p>
              <p className="text-[9px] md:text-xs tracking-wider uppercase text-warm-500">Done</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-lg md:text-xl font-light text-warm-600">{partner1Tasks}</p>
              <p className="text-[9px] md:text-xs tracking-wider uppercase text-warm-500 truncate max-w-[60px]">{partner1Name}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-lg md:text-xl font-light text-warm-600">{partner2Tasks}</p>
              <p className="text-[9px] md:text-xs tracking-wider uppercase text-warm-500 truncate max-w-[60px]">{partner2Name}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-xs md:text-sm text-warm-500">Filter:</Label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value as Task["assignee"] | "all")}
              className="px-2 md:px-3 py-1 md:py-1.5 border border-warm-300 text-xs md:text-sm rounded bg-white"
            >
              <option value="all">All</option>
              <option value="partner1">{partner1Name}</option>
              <option value="partner2">{partner2Name}</option>
              <option value="both">Both</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Mobile Column Selector */}
        <div className="md:hidden mb-4">
          <div className="flex rounded-lg overflow-hidden border border-warm-200">
            {[
              { status: "todo" as const, label: "To Do", count: todoTasks.length, color: "bg-warm-100" },
              { status: "in-progress" as const, label: "Progress", count: inProgressTasks.length, color: "bg-amber-100" },
              { status: "done" as const, label: "Done", count: doneTasks.length, color: "bg-green-100" },
            ].map(({ status, label, count, color }) => (
              <button
                key={status}
                onClick={() => setMobileColumn(status)}
                className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                  mobileColumn === status
                    ? `${color} text-warm-800`
                    : "bg-white text-warm-500"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Task List */}
        <div className="md:hidden">
          {getMobileColumnTasks().length > 0 ? (
            getMobileColumnTasks().map((task) => (
              <MobileTaskCard key={task.id} task={task} />
            ))
          ) : (
            <p className="text-center text-sm py-8 text-warm-400 italic bg-warm-50 rounded-lg">
              No tasks here yet
            </p>
          )}
        </div>

        {/* Desktop Task Board Columns */}
        <div className="hidden md:flex gap-6 overflow-x-auto pb-4">
          <Column
            title="To Do"
            tasks={todoTasks}
            status="todo"
            headerColor="bg-warm-200"
          />
          <Column
            title="In Progress"
            tasks={inProgressTasks}
            status="in-progress"
            headerColor="bg-amber-200"
          />
          <Column
            title="Done"
            tasks={doneTasks}
            status="done"
            headerColor="bg-green-200"
          />
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-md mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Add New Task</DialogTitle>
            <DialogDescription className="text-sm">
              Create a task and assign it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">What needs to be done?</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Book photographer"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                autoFocus
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Who&apos;s responsible?</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["unassigned", "partner1", "partner2", "both"] as const).map((assignee) => (
                  <button
                    key={assignee}
                    onClick={() => setNewTaskAssignee(assignee)}
                    className={`px-2 py-2 border rounded-lg text-xs md:text-sm transition-colors ${
                      newTaskAssignee === assignee
                        ? "border-warm-500 bg-warm-50 text-warm-700"
                        : "border-warm-200 hover:border-warm-300"
                    }`}
                  >
                    {assignee === "partner1" ? partner1Name :
                     assignee === "partner2" ? partner2Name :
                     assignee === "both" ? "Both" : "Unassigned"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Color</Label>
              <div className="flex gap-3">
                {(["yellow", "pink", "blue", "green", "purple"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTaskColor(color)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 transition-all ${
                      color === "yellow" ? "bg-yellow-200 border-yellow-300" :
                      color === "pink" ? "bg-pink-200 border-pink-300" :
                      color === "blue" ? "bg-blue-200 border-blue-300" :
                      color === "green" ? "bg-green-200 border-green-300" :
                      "bg-purple-200 border-purple-300"
                    } ${newTaskColor === color ? "ring-2 ring-warm-500 ring-offset-2" : "hover:scale-105"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1 text-sm">
              Cancel
            </Button>
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="flex-1 bg-warm-600 hover:bg-warm-700 text-white text-sm"
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-lg mx-4 md:mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              Suggested Tasks
            </DialogTitle>
            <DialogDescription className="text-sm">
              Based on your budget items
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 md:space-y-6">
            {suggestedTasks.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-warm-500 text-sm">No suggestions available.</p>
                <p className="text-xs text-warm-400 mt-2">
                  Add vendors to your budget to get suggestions!
                </p>
              </div>
            ) : (
              suggestedTasks.map(({ category, tasks: categoryTasks }) => (
                <div key={category} className="border border-warm-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h4 className="font-medium text-warm-700 text-sm md:text-base">{category}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addAllFromCategory(category, categoryTasks)}
                      className="text-[10px] md:text-xs h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      All ({categoryTasks.length})
                    </Button>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    {categoryTasks.map((task) => (
                      <div
                        key={task}
                        className="flex items-center justify-between py-1.5 md:py-2 px-2 md:px-3 bg-warm-50 rounded hover:bg-warm-100 group"
                      >
                        <span className="text-xs md:text-sm text-warm-600">{task}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSuggestedTask(task, category)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowSuggestions(false)}
            className="w-full text-sm"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
