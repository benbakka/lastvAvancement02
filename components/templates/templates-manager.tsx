'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TemplateCreator } from './template-creator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Wrench,
  Edit,
  Trash2,
  Eye,
  Copy,
  FolderOpen,
  FileText,
  Users,
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  X
} from 'lucide-react';
import { Template } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Helper function to calculate progress status based on planned dates and progress
const calculateProgressStatus = (
  plannedStartDate: string | undefined,
  plannedEndDate: string | undefined,
  progress: number
): 'on_schedule' | 'ahead' | 'behind' | 'at_risk' => {
  if (!plannedStartDate || !plannedEndDate) return 'on_schedule';

  const now = new Date();
  const start = new Date(plannedStartDate);
  const end = new Date(plannedEndDate);

  // If task hasn't started yet (per plan)
  if (now < start) {
    return progress > 0 ? 'ahead' : 'on_schedule';
  }

  // If task is past end date
  if (now > end) {
    return progress === 100 ? 'on_schedule' : 'at_risk';
  }

  // During scheduled period - calculate expected progress based on elapsed time
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();
  const expectedProgress = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

  // Determine status based on difference between actual and expected progress
  const diff = progress - expectedProgress;

  if (diff >= 10) return 'ahead';
  if (diff <= -20) return 'at_risk';
  if (diff < 0) return 'behind';
  return 'on_schedule';
};

// Helper function to update status based on progress
const getStatusFromProgress = (progress: number): 'pending' | 'in_progress' | 'completed' | 'delayed' => {
  if (progress === 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'pending';
};

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'delayed':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to get progress status color
const getProgressStatusColor = (status: string): string => {
  switch (status) {
    case 'ahead':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'on_schedule':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'behind':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'at_risk':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to format dates from array format
const formatDateFromArray = (dateArray: any): string => {
  if (!dateArray) return '';
  
  // If it's already a string, return it
  if (typeof dateArray === 'string') return dateArray;
  
  // If it's an array in the format [year, month, day, ...]
  if (Array.isArray(dateArray)) {
    try {
      // Month in JS Date is 0-indexed, but our array uses 1-indexed months
      const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date invalide';
    }
  }
  
  return 'Format de date inconnu';
};

interface TaskFormType {
  name: string;
  description: string;
  teamId?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  duration: string;
  amount: string;
  progress: number;
  progressStatus: 'on_schedule' | 'ahead' | 'behind' | 'at_risk';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  remarks?: string;
  isReceived: boolean;
  isPaid: boolean;
}

interface TeamFormType {
  name: string;
  specialty: string;
  tasks: TaskFormType[];
}

interface CategoryFormType {
  name: string;
  startDate: string;
  endDate: string;
  teams: TeamFormType[];
  tasks?: TaskFormType[]; // Add tasks property for backend compatibility
}

interface TemplateFormType {
  name: string;
  description: string;
  categories: CategoryFormType[];
}

export function TemplatesManager() {
  const { templates, villas, addTemplate, updateTemplate, deleteTemplate, setLoading } = useStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [backendTemplates, setBackendTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState<TemplateFormType>({
    name: '',
    description: '',
    categories: [{
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      teams: [{
        name: '',
        specialty: '',
        tasks: [{
          name: '',
          description: '',
          duration: '',
          amount: '',
          plannedStartDate: new Date().toISOString().split('T')[0],
          plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          actualStartDate: new Date().toISOString().split('T')[0],
          actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 0,
          progressStatus: 'on_schedule' as const,
          status: 'pending' as const,
          isReceived: false,
          isPaid: false,
          remarks: ''
        }]
      }]
    }]
  });

  // State for task editing dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [editingTask, setEditingTask] = useState<boolean>(false);

  // Task form data for the dialog
  const [taskFormData, setTaskFormData] = useState<TaskFormType>({
    name: '',
    description: '',
    duration: '',
    amount: '',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    actualStartDate: new Date().toISOString().split('T')[0],
    actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    progressStatus: 'on_schedule',
    status: 'pending',
    isReceived: false,
    isPaid: false,
    remarks: ''
  });

  // Load templates from backend
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const fetchedTemplates = await apiService.getAllTemplates();
      setBackendTemplates(fetchedTemplates);
      
      // Also add to store for compatibility
      fetchedTemplates.forEach((template: any) => {
        addTemplate({
          id: template.id.toString(),
          name: template.name,
          description: template.description || '',
          categories: [], // Will be loaded when needed
          createdAt: new Date(template.createdAt)
        });
      });
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = backendTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    // Check if name is provided
    if (!formData.name.trim()) return false;

    // Check if at least one category is provided with name
    if (!formData.categories.length) return false;
    if (!formData.categories.every(cat => cat.name.trim())) return false;

    // Check if each category has at least one team with name and specialty
    if (!formData.categories.every(cat =>
      cat.teams.length &&
      cat.teams.every(team => team.name.trim() && team.specialty.trim())
    )) return false;

    return true;
  };

  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setIsCreatorOpen(true);
  };

  const handleEditTemplate = async (template: any) => {
    try {
      setLoading(true);
      // Fetch the complete template data with all nested details
      const completeTemplate = await apiService.getTemplateById(template.id);
      console.log('Complete template for editing:', completeTemplate);
      
      // Set the editing template ID
      setEditingTemplateId(completeTemplate.id.toString());
      
      // Prepare the form data from the complete template
      const formattedTemplate: TemplateFormType = {
        name: completeTemplate.name,
        description: completeTemplate.description || '',
        categories: completeTemplate.categories?.map((category: any) => {
          // Create a default team for each category to hold tasks
          const defaultTeam = {
            name: 'Équipe par défaut',
            specialty: '',
            tasks: category.tasks?.map((task: any) => ({
              name: task.name,
              description: task.description || '',
              teamId: undefined,
              plannedStartDate: task.plannedStartDate ? formatDateArrayToString(task.plannedStartDate) : new Date().toISOString().split('T')[0],
              plannedEndDate: task.plannedEndDate ? formatDateArrayToString(task.plannedEndDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              actualStartDate: task.actualStartDate ? formatDateArrayToString(task.actualStartDate) : '',
              actualEndDate: task.actualEndDate ? formatDateArrayToString(task.actualEndDate) : '',
              duration: task.durationDays ? task.durationDays.toString() : '',
              amount: task.amount ? task.amount.toString() : '',
              progress: task.progress || 0,
              progressStatus: (task.progressStatus?.toLowerCase() || 'on_schedule') as 'on_schedule' | 'ahead' | 'behind' | 'at_risk',
              status: (task.status?.toLowerCase() || 'pending') as 'pending' | 'in_progress' | 'completed' | 'delayed',
              remarks: task.remarks || '',
              isReceived: task.isReceived || false,
              isPaid: task.isPaid || false
            })) || []
          };
          
          return {
            name: category.name,
            startDate: category.startDate ? formatDateArrayToString(category.startDate) : new Date().toISOString().split('T')[0],
            endDate: category.endDate ? formatDateArrayToString(category.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            teams: [defaultTeam]
          };
        }) || []
      };
      
      console.log('Formatted template for form:', formattedTemplate);
      
      // Set the form data
      setFormData(formattedTemplate);
      
      // Open the creator dialog
      setIsCreatorOpen(true);
    } catch (error) {
      console.error('Failed to load template for editing:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le template pour modification.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to convert date array to string format for form inputs
  const formatDateArrayToString = (dateArray: any): string => {
    if (!dateArray) return new Date().toISOString().split('T')[0];
    
    if (Array.isArray(dateArray)) {
      try {
        // Month in JS Date is 0-indexed, but our array uses 1-indexed months
        const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input type="date"
      } catch (e) {
        console.error('Error formatting date for form:', e);
        return new Date().toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const handleTemplateCreated = async (template: any) => {
    setIsCreatorOpen(false);
    setEditingTemplateId(null);
    await loadTemplates(); // Reload templates
    toast({
      title: 'Template sauvegardé',
      description: 'Le template a été sauvegardé avec succès.',
    });
  };

  // Function to load complete template data when viewing a template
  const handleViewTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      console.log('Loading template with ID:', templateId);
      
      // Get the template basic info
      const completeTemplate = await apiService.getTemplateById(templateId);
      console.log('Complete template data from API:', completeTemplate);
      
      // When viewing the template, we want to show all tasks regardless of hideInTemplateView flag
      if (completeTemplate && completeTemplate.categories) {
        completeTemplate.categories = await Promise.all(
          completeTemplate.categories.map(async (category: any) => {
            try {
              // Get all tasks for this category, including those marked as hidden
              console.log('Loading tasks for category ID:', category.id);
              const tasks = await apiService.getTasksByTemplateCategoryId(category.id);
              console.log(`Loaded ${tasks?.length || 0} tasks for category ${category.name}`);
              
              return {
                ...category,
                tasks: tasks || []
              };
            } catch (categoryError) {
              console.error(`Error loading tasks for category ${category.id}:`, categoryError);
              return {
                ...category,
                tasks: []
              };
            }
          })
        );
      } else {
        console.warn('Template has no categories or is undefined:', completeTemplate);
      }
      
      console.log('Setting viewingTemplate state with data:', completeTemplate);
      setViewingTemplate(completeTemplate);
      console.log('ViewingTemplate state should be updated now');
    } catch (error) {
      console.error('Failed to load template details:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du template.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog for template editing
  const openEditDialog = (template: Template) => {
    // Map Template to TemplateFormType with all detailed fields
    const formattedTemplate: TemplateFormType = {
      name: template.name,
      description: template.description,
      categories: template.categories.map(category => ({
        name: category.name,
        startDate: new Date().toISOString().split('T')[0], // Default if not present
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default if not present
        teams: category.teams.map(team => ({
          name: team.name,
          specialty: team.specialty || '',
          tasks: team.tasks.map(task => ({
            name: task.name,
            description: task.description || '',
            duration: task.duration || '',
            amount: task.amount || '',
            plannedStartDate: task.plannedStartDate || new Date().toISOString().split('T')[0],
            plannedEndDate: task.plannedEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            actualStartDate: task.actualStartDate || new Date().toISOString().split('T')[0],
            actualEndDate: task.actualEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: task.progress || 0,
            progressStatus: task.progressStatus || 'on_schedule',
            status: task.status || 'pending',
            remarks: task.remarks || '',
            isReceived: task.isReceived || false,
            isPaid: task.isPaid || false
          }))
        }))
      }))
    };

    setFormData(formattedTemplate);
    setEditingTemplateId(template.id);
  };

  // Function to handle template deletion with confirmation - defined once

  // This function is now replaced by the handleSubmit function
  // Keeping it for backward compatibility with existing code
  const handleUpdateTemplate = () => {
    // Just call handleSubmit with a synthetic event
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categories: [{
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teams: [{
          name: '',
          specialty: '',
          tasks: [{
            name: '',
            description: '',
            duration: '',
            amount: '',
            plannedStartDate: new Date().toISOString().split('T')[0],
            plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            actualStartDate: new Date().toISOString().split('T')[0],
            actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: 0,
            progressStatus: 'on_schedule' as const,
            status: 'pending' as const,
            isReceived: false,
            isPaid: false,
            remarks: ''
          }]
        }]
      }]
    });
  };

  // Function to duplicate a template
  const duplicateTemplate = async (template: any) => {
    try {
      setLoading(true);
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Copie)`,
        id: undefined // Remove ID to create new
      };
      
      await apiService.createTemplate(duplicatedTemplate);
      await loadTemplates();
      toast({
        title: 'Template dupliqué',
        description: 'Le template a été dupliqué avec succès.',
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de dupliquer le template.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get total teams in a template
  const getTotalTeams = (template: Template): number => {
    return template.categories.reduce((total, category) => total + category.teams.length, 0);
  };

  // Function to get total tasks in a template
  const getTotalTasks = (template: Template): number => {
    return template.categories.reduce((categoryTotal, category) => {
      return categoryTotal + category.teams.reduce((teamTotal, team) => {
        return teamTotal + (team.tasks?.length || 0);
      }, 0);
    }, 0);
  };

  // Function to delete template with confirmation
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      await apiService.deleteTemplate(templateId);
      await loadTemplates(); // Reload templates
      toast({
        title: 'Template supprimé',
        description: 'Le template a été supprimé avec succès.',
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le template.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Category functions
  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, {
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teams: [{
          name: '',
          specialty: '',
          tasks: [{
            name: '',
            description: '',
            duration: '',
            amount: '',
            plannedStartDate: new Date().toISOString().split('T')[0],
            plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            actualStartDate: new Date().toISOString().split('T')[0],
            actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: 0,
            progressStatus: 'on_schedule' as const,
            status: 'pending' as const,
            isReceived: false,
            isPaid: false,
            remarks: ''
          }]
        }]
      }]
    });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    });
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setFormData({ ...formData, categories: updatedCategories });
  };

  // Team functions
  const addTeam = (categoryIndex: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams.push({
      name: '',
      specialty: '',
      tasks: [{
        name: '',
        description: '',
        duration: '',
        amount: '',
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualStartDate: new Date().toISOString().split('T')[0],
        actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        progressStatus: 'on_schedule' as const,
        status: 'pending' as const,
        isReceived: false,
        isPaid: false,
        remarks: ''
      }]
    });
    setFormData({ ...formData, categories: updatedCategories });
  };

  const removeTeam = (categoryIndex: number, teamIndex: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams = updatedCategories[categoryIndex].teams.filter((_, i) => i !== teamIndex);
    setFormData({ ...formData, categories: updatedCategories });
  };

  const updateTeam = (categoryIndex: number, teamIndex: number, field: string, value: string) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams[teamIndex] = {
      ...updatedCategories[categoryIndex].teams[teamIndex],
      [field]: value
    };
    setFormData({ ...formData, categories: updatedCategories });
  };

  // Task functions
  const addTask = (categoryIndex: number, teamIndex: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams[teamIndex].tasks.push({
      name: '',
      description: '',
      duration: '',
      amount: '',
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      actualStartDate: new Date().toISOString().split('T')[0],
      actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      progressStatus: 'on_schedule' as const,
      status: 'pending' as const,
      isReceived: false,
      isPaid: false,
      remarks: ''
    });
    setFormData({ ...formData, categories: updatedCategories });
  };

  const removeTask = (categoryIndex: number, teamIndex: number, taskIndex: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams[teamIndex].tasks =
      updatedCategories[categoryIndex].teams[teamIndex].tasks.filter((_, i) => i !== taskIndex);
    setFormData({ ...formData, categories: updatedCategories });
  };

  const updateTask = (categoryIndex: number, teamIndex: number, taskIndex: number, field: string, value: string | number | boolean) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].teams[teamIndex].tasks[taskIndex] = {
      ...updatedCategories[categoryIndex].teams[teamIndex].tasks[taskIndex],
      [field]: value
    };

    // If updating progress, automatically update progress status and task status
    if (field === 'progress') {
      const task = updatedCategories[categoryIndex].teams[teamIndex].tasks[taskIndex];
      const progressValue = value as number;

      // Update task status based on progress
      task.status = getStatusFromProgress(progressValue);

      // Update progress status based on planned dates and progress
      task.progressStatus = calculateProgressStatus(
        task.plannedStartDate,
        task.plannedEndDate,
        progressValue
      );
    }

    setFormData({ ...formData, categories: updatedCategories });
  };

  // Task dialog functions
  const openTaskDialog = (categoryIndex: number, teamIndex: number, taskIndex?: number) => {
    setCurrentCategoryIndex(categoryIndex);
    setCurrentTeamIndex(teamIndex);

    if (taskIndex !== undefined) {
      // Editing existing task
      setCurrentTaskIndex(taskIndex);
      setEditingTask(true);
      const task = formData.categories[categoryIndex].teams[teamIndex].tasks[taskIndex];
      setTaskFormData({
        name: task.name,
        description: task.description,
        duration: task.duration,
        amount: task.amount,
        plannedStartDate: task.plannedStartDate,
        plannedEndDate: task.plannedEndDate,
        actualStartDate: task.actualStartDate || '',
        actualEndDate: task.actualEndDate || '',
        progress: task.progress,
        progressStatus: task.progressStatus,
        status: task.status,
        isReceived: task.isReceived,
        isPaid: task.isPaid,
        remarks: task.remarks || ''
      });
    } else {
      // Creating new task
      setEditingTask(false);
      setTaskFormData({
        name: '',
        description: '',
        duration: '',
        amount: '',
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualStartDate: '',
        actualEndDate: '',
        progress: 0,
        progressStatus: 'on_schedule',
        status: 'pending',
        isReceived: false,
        isPaid: false,
        remarks: ''
      });
    }

    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = () => {
    if (!taskFormData.name) {
      toast({
        title: "Erreur",
        description: "Le nom de la tâche est requis",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = [...formData.categories];

    if (editingTask) {
      // Update existing task
      updatedCategories[currentCategoryIndex].teams[currentTeamIndex].tasks[currentTaskIndex] = {
        ...taskFormData
      };
    } else {
      // Add new task
      updatedCategories[currentCategoryIndex].teams[currentTeamIndex].tasks.push({
        ...taskFormData
      });
    }

    setFormData({
      ...formData,
      categories: updatedCategories
    });

    setIsTaskDialogOpen(false);
  };

  const handleTaskProgressChange = (value: number) => {
    // Update progress
    setTaskFormData(prev => {
      const updated = { ...prev, progress: value };

      // Update status based on progress
      updated.status = getStatusFromProgress(value);

      // Update progress status based on planned dates and progress
      updated.progressStatus = calculateProgressStatus(
        updated.plannedStartDate,
        updated.plannedEndDate,
        value
      );

      return updated;
    });
  };

  // Handle template form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du template est requis",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "La description du template est requise",
        variant: "destructive"
      });
      return;
    }

    // Validate categories
    if (formData.categories.length === 0) {
      toast({
        title: "Erreur",
        description: "Vous devez ajouter au moins une catégorie",
        variant: "destructive"
      });
      return;
    }

    // Check for empty category names
    const hasEmptyCategory = formData.categories.some(cat => !cat.name.trim());
    if (hasEmptyCategory) {
      toast({
        title: "Erreur",
        description: "Toutes les catégories doivent avoir un nom",
        variant: "destructive"
      });
      return;
    }

    // Map detailed form data to simplified Template type
    const templateData: Template = {
      id: editingTemplateId || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      createdAt: new Date(),
      categories: formData.categories.map(category => ({
        name: category.name,
        teams: category.teams.map(team => ({
          name: team.name,
          specialty: team.specialty,
          tasks: team.tasks.map(task => ({
            name: task.name,
            duration: task.duration,
            amount: task.amount,
            // Store all detailed fields as well for when template is applied
            description: task.description,
            plannedStartDate: task.plannedStartDate,
            plannedEndDate: task.plannedEndDate,
            actualStartDate: task.actualStartDate,
            actualEndDate: task.actualEndDate,
            progress: task.progress,
            progressStatus: task.progressStatus,
            status: task.status,
            remarks: task.remarks,
            isReceived: task.isReceived,
            isPaid: task.isPaid
          }))
        }))
      }))
    };

    if (editingTemplateId) {
      // Update existing template
      updateTemplate(templateData.id, templateData);
      toast({
        title: "Succès",
        description: "Le template a été mis à jour avec succès"
      });
    } else {
      // Create new template
      addTemplate(templateData);
      toast({
        title: "Succès",
        description: "Le template a été créé avec succès"
      });
    }

    // Reset form and close dialog
    resetForm();
    setEditingTemplateId(null);
    setIsCreateDialogOpen(false);
  };

  // Function to view template details
  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
  }; 

  return (
    
    <div className="space-y-6">

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskName" className="text-right">
                Nom *
              </Label>
              <Input
                id="taskName"
                value={taskFormData.name}
                onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="taskDescription"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskDuration" className="text-right">
                Durée
              </Label>
              <Input
                id="taskDuration"
                value={taskFormData.duration}
                onChange={(e) => setTaskFormData({ ...taskFormData, duration: e.target.value })}
                className="col-span-3"
                placeholder="ex: 5 jours"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskAmount" className="text-right">
                Montant
              </Label>
              <Input
                id="taskAmount"
                value={taskFormData.amount}
                onChange={(e) => setTaskFormData({ ...taskFormData, amount: e.target.value })}
                className="col-span-3"
                placeholder="ex: 1000 €"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plannedStartDate" className="text-right">
                Date de début prévue
              </Label>
              <Input
                id="plannedStartDate"
                type="date"
                value={taskFormData.plannedStartDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, plannedStartDate: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plannedEndDate" className="text-right">
                Date de fin prévue
              </Label>
              <Input
                id="plannedEndDate"
                type="date"
                value={taskFormData.plannedEndDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, plannedEndDate: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actualStartDate" className="text-right">
                Date de début réelle
              </Label>
              <Input
                id="actualStartDate"
                type="date"
                value={taskFormData.actualStartDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, actualStartDate: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actualEndDate" className="text-right">
                Date de fin réelle
              </Label>
              <Input
                id="actualEndDate"
                type="date"
                value={taskFormData.actualEndDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, actualEndDate: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progress" className="text-right">
                Progression ({taskFormData.progress}%)
              </Label>
              <div className="col-span-3">
                <Progress value={taskFormData.progress} className="h-2" />
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={taskFormData.progress}
                  onChange={(e) => handleTaskProgressChange(parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select
                value={taskFormData.status}
                onValueChange={(value) => setTaskFormData({ ...taskFormData, status: value as 'pending' | 'in_progress' | 'completed' | 'delayed' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="delayed">Retardé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progressStatus" className="text-right">
                État d'avancement
              </Label>
              <div className="col-span-3 flex items-center">
                <Badge className={getProgressStatusColor(taskFormData.progressStatus)}>
                  {taskFormData.progressStatus === 'on_schedule' && 'Dans les délais'}
                  {taskFormData.progressStatus === 'ahead' && 'En avance'}
                  {taskFormData.progressStatus === 'behind' && 'En retard'}
                  {taskFormData.progressStatus === 'at_risk' && 'À risque'}
                </Badge>
                <span className="ml-2 text-sm text-gray-500">(Calculé automatiquement)</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remarks" className="text-right">
                Remarques
              </Label>
              <Textarea
                id="remarks"
                value={taskFormData.remarks}
                onChange={(e) => setTaskFormData({ ...taskFormData, remarks: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Financier
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isReceived"
                    checked={taskFormData.isReceived}
                    onCheckedChange={(checked) =>
                      setTaskFormData({ ...taskFormData, isReceived: checked as boolean })
                    }
                  />
                  <Label htmlFor="isReceived">Reçu</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPaid"
                    checked={taskFormData.isPaid}
                    onCheckedChange={(checked) =>
                      setTaskFormData({ ...taskFormData, isPaid: checked as boolean })
                    }
                  />
                  <Label htmlFor="isPaid">Payé</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleTaskSubmit}>{editingTask ? 'Mettre à jour' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Templates</h1>
          <p className="text-gray-600 mt-1">Créez des templates réutilisables pour vos villas</p>
        </div>
        
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Rechercher des templates..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{backendTemplates.length}</div>
              <div className="text-sm text-gray-600">Templates totaux</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredTemplates.length}
              </div>
              <div className="text-sm text-gray-600">Templates actifs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                0
              </div>
              <div className="text-sm text-gray-600">Catégories totales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                0
              </div>
              <div className="text-sm text-gray-600">Tâches totales</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={`template-${template.id}`} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  {template.name}
                </CardTitle>
                <Badge variant="outline" className="text-blue-600">
                  Template
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {template.description || 'Aucune description'}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Créé le {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('View button clicked for template:', template.id);
                      // Ensure template ID is a string
                      const templateId = template.id.toString();
                      console.log('Using template ID:', templateId);
                      handleViewTemplate(templateId);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => duplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id.toString())}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun template trouvé</h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm ? 'Aucun template ne correspond à votre recherche.' : 'Commencez par créer votre premier template.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Creator Dialog */}
      <Dialog open={isCreatorOpen} onOpenChange={setIsCreatorOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? 'Modifier le Template' : 'Créer un Template'}
            </DialogTitle>
          </DialogHeader>
          <TemplateCreator
            templateId={editingTemplateId || undefined}
            formData={editingTemplateId ? formData : undefined}
            onSave={handleTemplateCreated}
            onCancel={() => setIsCreatorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog 
        open={!!viewingTemplate} 
        onOpenChange={(open) => {
          console.log('Template dialog open state changed:', open);
          if (!open) setViewingTemplate(null);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Détails du template: {viewingTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingTemplate ? (
            <div className="space-y-6">
              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nom</Label>
                      <p className="text-lg font-semibold">{viewingTemplate.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-lg font-semibold">{viewingTemplate.description || 'Aucune description'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Créé le</Label>
                      <p className="text-lg font-semibold">{formatDateFromArray(viewingTemplate.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Template Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderOpen className="h-5 w-5 mr-2" />
                    Catégories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewingTemplate.categories && viewingTemplate.categories.length > 0 ? (
                    <div className="space-y-4">
                      {viewingTemplate.categories.map((category: any, catIndex: number) => (
                        <Card key={`cat-${catIndex}`} className="border border-gray-200">
                          <CardHeader className="bg-gray-50 py-2">
                            <CardTitle className="text-base">{category.name}</CardTitle>
                            {category.startDate && category.endDate && (
                              <div className="text-sm text-gray-600 flex items-center mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateFromArray(category.startDate)} - {formatDateFromArray(category.endDate)}
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="pt-4">
                            {/* Tasks for this category */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-600 flex items-center">
                                <ClipboardList className="h-4 w-4 mr-1" /> Tâches
                              </h4>
                              {/* Show tasks when explicitly viewing a template */}
                              {category.tasks && category.tasks.length > 0 ? (
                                <div className="space-y-2">
                                  {category.tasks.map((task: any, taskIndex: number) => (
                                    <div key={`task-${catIndex}-${taskIndex}`} className="p-3 bg-gray-50 rounded-md">
                                      <div className="flex justify-between items-center">
                                        <div className="font-medium">{task.name}</div>
                                        {task.durationDays && (
                                          <Badge variant="outline" className="ml-2">
                                            <Clock className="h-3 w-3 mr-1" /> {task.durationDays} jours
                                          </Badge>
                                        )}
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                      )}
                                      {task.plannedStartDate && task.plannedEndDate && (
                                        <div className="text-xs text-gray-500 mt-2 flex items-center">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {formatDateFromArray(task.plannedStartDate)} - {formatDateFromArray(task.plannedEndDate)}
                                        </div>
                                      )}
                                      {task.amount && (
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          {task.amount} €
                                        </div>
                                      )}
                                      {task.status && (
                                        <div className="mt-2">
                                          <Badge className={getStatusColor(task.status)}>
                                            {task.status === 'PENDING' && 'En attente'}
                                            {task.status === 'IN_PROGRESS' && 'En cours'}
                                            {task.status === 'COMPLETED' && 'Terminé'}
                                            {task.status === 'DELAYED' && 'Retardé'}
                                          </Badge>
                                          {task.progress > 0 && (
                                            <div className="mt-1">
                                              <Progress value={task.progress} className="h-1" />
                                              <span className="text-xs text-gray-500">{task.progress}%</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Aucune tâche pour cette catégorie</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune catégorie définie pour ce template</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleEditTemplate(viewingTemplate)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button onClick={() => setViewingTemplate(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Chargement des détails du template...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}