'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  Save,
  FolderOpen,
  ClipboardList,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Building2,
  Home,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCategory {
  id?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  tasks: TemplateTask[];
  isExpanded?: boolean;
}

interface TemplateTask {
  id?: string;
  name: string;
  description: string;
  teamId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  durationDays: number;
  status: string;
  progress: number;
  progressStatus: string;
  isReceived: boolean;
  isPaid: boolean;
  amount: number;
  remarks: string;
}

interface TemplateCreatorProps {
  templateId?: string;
  formData?: any; 
  onSave: (template: any) => void;
  onCancel: () => void;
}

export function TemplateCreator({ templateId, formData, onSave, onCancel }: TemplateCreatorProps) {
  const { teams } = useStore();
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState(formData?.name || '');
  const [templateDescription, setTemplateDescription] = useState(formData?.description || '');
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedTeamTasks, setSelectedTeamTasks] = useState<Record<string, any[]>>({});

  // Load existing template if editing
  useEffect(() => {
    if (formData) {
      console.log('Using formData from parent:', formData);
      setTemplateName(formData.name || '');
      setTemplateDescription(formData.description || '');
      
      // Convert formData categories to the expected format and ensure tasks are loaded
      const convertedCategories = (formData.categories || []).map((cat: any) => ({
        id: cat.id || `temp-${Date.now()}-${Math.random()}`,
        name: cat.name || '',
        startDate: cat.startDate ? (cat.startDate instanceof Date ? cat.startDate.toISOString().split('T')[0] : cat.startDate) : '',
        endDate: cat.endDate ? (cat.endDate instanceof Date ? cat.endDate.toISOString().split('T')[0] : cat.endDate) : '',
        tasks: (cat.tasks || []).map((task: any) => ({
          id: task.id || `temp-task-${Date.now()}-${Math.random()}`,
          name: task.name || '',
          description: task.description || '',
          teamId: task.teamId ? task.teamId.toString() : '',
          plannedStartDate: task.plannedStartDate ? (task.plannedStartDate instanceof Date ? task.plannedStartDate.toISOString().split('T')[0] : task.plannedStartDate) : '',
          plannedEndDate: task.plannedEndDate ? (task.plannedEndDate instanceof Date ? task.plannedEndDate.toISOString().split('T')[0] : task.plannedEndDate) : '',
          durationDays: typeof task.durationDays === 'number' ? task.durationDays : (parseInt(task.durationDays) || 7),
          status: task.status || 'PENDING',
          progress: typeof task.progress === 'number' ? task.progress : (parseInt(task.progress) || 0),
          progressStatus: task.progressStatus || 'ON_SCHEDULE',
          isReceived: Boolean(task.isReceived),
          isPaid: Boolean(task.isPaid),
          amount: typeof task.amount === 'number' ? task.amount : (parseFloat(task.amount) || 0),
          remarks: task.remarks || ''
        })),
        isExpanded: true
      }));
      
      setCategories(convertedCategories);
      console.log('Converted categories with tasks:', convertedCategories);
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, formData]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      const template = await apiService.getTemplateById(id);
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      
      // Convert template data to match our local structure
      const categoriesWithTasks = (template.categories || []).map((category: any) => ({
        id: category.id ? category.id.toString() : `temp-${Date.now()}-${Math.random()}`,
        name: category.name || '',
        startDate: category.startDate ? (category.startDate instanceof Date ? category.startDate.toISOString().split('T')[0] : category.startDate) : '',
        endDate: category.endDate ? (category.endDate instanceof Date ? category.endDate.toISOString().split('T')[0] : category.endDate) : '',
        tasks: (category.tasks || []).map((task: any) => ({
          id: task.id ? task.id.toString() : `temp-task-${Date.now()}-${Math.random()}`,
          name: task.name || '',
          description: task.description || '',
          teamId: task.teamId ? task.teamId.toString() : '',
          plannedStartDate: task.plannedStartDate ? (task.plannedStartDate instanceof Date ? task.plannedStartDate.toISOString().split('T')[0] : task.plannedStartDate) : '',
          plannedEndDate: task.plannedEndDate ? (task.plannedEndDate instanceof Date ? task.plannedEndDate.toISOString().split('T')[0] : task.plannedEndDate) : '',
          durationDays: typeof task.durationDays === 'number' ? task.durationDays : (parseInt(task.durationDays) || 7),
          status: task.status || 'PENDING',
          progress: typeof task.progress === 'number' ? task.progress : (parseInt(task.progress) || 0),
          progressStatus: task.progressStatus || 'ON_SCHEDULE',
          isReceived: Boolean(task.isReceived),
          isPaid: Boolean(task.isPaid),
          amount: typeof task.amount === 'number' ? task.amount : (parseFloat(task.amount) || 0),
          remarks: task.remarks || ''
        })),
        isExpanded: true
      }));
      
      setCategories(categoriesWithTasks);
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    const newCategory: TemplateCategory = {
      id: `temp-${Date.now()}`,
      name: '',
      startDate: '',
      endDate: '',
      tasks: [],
      isExpanded: true
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (categoryId: string, updates: Partial<TemplateCategory>) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  const addTask = (categoryId: string) => {
    const newTask: TemplateTask = {
      id: `temp-task-${Date.now()}`,
      name: '',
      description: '',
      teamId: '',
      plannedStartDate: '',
      plannedEndDate: '',
      durationDays: 7,
      status: 'PENDING',
      progress: 0,
      progressStatus: 'ON_SCHEDULE',
      isReceived: false,
      isPaid: false,
      amount: 0,
      remarks: ''
    };

    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, tasks: [...cat.tasks, newTask] }
        : cat
    ));
  };

  const updateTask = (categoryId: string, taskId: string, updates: Partial<TemplateTask>) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            tasks: cat.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        : cat
    ));
  };

  const deleteTask = (categoryId: string, taskId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, tasks: cat.tasks.filter(task => task.id !== taskId) }
        : cat
    ));
  };

  const loadTeamTasks = async (teamId: string) => {
    if (selectedTeamTasks[teamId]) return;

    try {
      const teamTasks = await apiService.getTaskTemplatesByTeamId(teamId);
      setSelectedTeamTasks(prev => ({
        ...prev,
        [teamId]: teamTasks || []
      }));
    } catch (error) {
      console.error('Failed to load team tasks:', error);
      setSelectedTeamTasks(prev => ({
        ...prev,
        [teamId]: []
      }));
    }
  };

  const handleTeamChange = (categoryId: string, taskId: string, teamId: string) => {
    updateTask(categoryId, taskId, { teamId });
    if (teamId) {
      loadTeamTasks(teamId);
    }
  };

  const handleTaskNameChange = (categoryId: string, taskId: string, taskName: string) => {
    updateTask(categoryId, taskId, { name: taskName });
    
    const category = categories.find(cat => cat.id === categoryId);
    const task = category?.tasks.find(t => t.id === taskId);
    
    if (task && task.teamId) {
      const teamTasks = selectedTeamTasks[task.teamId] || [];
      const selectedTemplate = teamTasks.find(t => t.name === taskName);
      
      if (selectedTemplate) {
        updateTask(categoryId, taskId, {
          name: taskName,
          description: selectedTemplate.description || '',
          durationDays: selectedTemplate.durationDays || 7,
          amount: selectedTemplate.defaultAmount || 0
        });
      }
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Veuillez saisir un nom pour le template');
      return;
    }

    if (categories.length === 0) {
      alert('Veuillez ajouter au moins une catégorie');
      return;
    }

    try {
      setLoading(true);

      const templateData = {
        name: templateName,
        description: templateDescription,
        categories: categories.map(category => ({
          name: category.name,
          startDate: category.startDate,
          endDate: category.endDate,
          tasks: (category.tasks || []).map(task => ({
            name: task.name,
            description: task.description,
            teamId: task.teamId || '',
            plannedStartDate: task.plannedStartDate,
            plannedEndDate: task.plannedEndDate,
            durationDays: task.durationDays,
            status: task.status,
            progress: task.progress,
            progressStatus: task.progressStatus,
            isReceived: task.isReceived,
            isPaid: task.isPaid,
            amount: task.amount,
            remarks: task.remarks
          }))
        }))
      };

      let savedTemplate;
      if (templateId) {
        savedTemplate = await apiService.updateTemplate(templateId, templateData);
      } else {
        savedTemplate = await apiService.createTemplate(templateData);
      }

      if (onSave) {
        onSave(savedTemplate);
      }

      alert('Template sauvegardé avec succès!');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Erreur lors de la sauvegarde du template');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DELAYED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Terminée';
      case 'IN_PROGRESS': return 'En cours';
      case 'DELAYED': return 'En retard';
      case 'PENDING': return 'En attente';
      default: return status;
    }
  };

  const getProgressStatusColor = (status: string) => {
    switch (status) {
      case 'ON_SCHEDULE': return 'text-green-600';
      case 'AHEAD': return 'text-blue-600';
      case 'BEHIND': return 'text-orange-600';
      case 'AT_RISK': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Non assignée';
  };

  return (
    <div className="space-y-6">
      {/* Template Header - Dashboard Style */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200/50 card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  {templateId ? 'Modifier le Template' : 'Créer un Template'}
                </CardTitle>
                <p className="text-blue-700 text-sm mt-1">
                  Configurez les catégories et tâches pour ce template
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-xs text-gray-600">Catégories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.reduce((sum, cat) => sum + cat.tasks.length, 0)}
                </div>
                <div className="text-xs text-gray-600">Tâches totales</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName" className="text-blue-900 font-medium">Nom du template</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Villa Standard, Appartement Type A"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="templateDescription" className="text-blue-900 font-medium">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Description du template..."
                rows={3}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Overview - Dashboard Style */}
      <Card className="border-l-4 border-l-blue-500 card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg">{templateName || 'Nouveau Template'}</h3>
                <p className="text-gray-600 text-sm">{templateDescription || 'Aucune description'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-xs text-gray-600">Catégories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.reduce((sum, cat) => sum + cat.tasks.length, 0)}
                </div>
                <div className="text-xs text-gray-600">Tâches totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {categories.reduce((sum, cat) => 
                    sum + cat.tasks.reduce((taskSum, task) => taskSum + (task.amount || 0), 0), 0
                  ).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Montant total (DH)</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categories - Dashboard Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Catégories</h2>
          <Button onClick={addCategory} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter Catégorie
          </Button>
        </div>

        {categories.map((category, categoryIndex) => (
          <Card key={category.id} className="border-l-4 border-l-orange-500 card-enhanced">
            <CardHeader className="pb-3">
              <Collapsible
                open={category.isExpanded}
                onOpenChange={() => toggleCategoryExpansion(category.id!)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      {category.isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-orange-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-orange-600" />
                      )}
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {category.name || `Catégorie ${categoryIndex + 1}`}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {category.startDate && category.endDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(category.startDate).toLocaleDateString()} - {new Date(category.endDate).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {category.tasks?.length || 0} tâches
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {category.tasks?.reduce((sum, task) => sum + (task.amount || 0), 0).toLocaleString()} DH
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {category.tasks?.length || 0} tâches
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {category.tasks?.reduce((sum, task) => sum + (task.amount || 0), 0).toLocaleString()} DH
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(category.id!);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-4 space-y-4">
                    {/* Category Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
                      <div>
                        <Label className="text-orange-900 font-medium">Nom de la catégorie</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategory(category.id!, { name: e.target.value })}
                          placeholder="Ex: Gros Œuvre, Plomberie"
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                      <div>
                        <Label className="text-orange-900 font-medium">Date de début</Label>
                        <Input
                          type="date"
                          value={category.startDate}
                          onChange={(e) => updateCategory(category.id!, { startDate: e.target.value })}
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                      <div>
                        <Label className="text-orange-900 font-medium">Date de fin</Label>
                        <Input
                          type="date"
                          value={category.endDate}
                          onChange={(e) => updateCategory(category.id!, { endDate: e.target.value })}
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                    </div>

                    {/* Tasks Section - Dashboard Style */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Tâches</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTask(category.id!)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>

                      {(category.tasks || []).map((task, taskIndex) => (
                        <Card key={task.id} className="border-l-4 border-l-purple-500 bg-purple-50/30 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="space-y-4">
                              {/* Task Header - Dashboard Style */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <ClipboardList className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">
                                      {task.name || `Tâche ${taskIndex + 1}`}
                                    </h5>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <Users className="h-3 w-3 mr-1" />
                                        {getTeamName(task.teamId)}
                                      </div>
                                      <div className="flex items-center">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        {task.amount.toLocaleString()} DH
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {task.durationDays} jours
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-center">
                                    <Progress value={task.progress} className="h-2 w-16" />
                                    <span className="text-xs text-gray-600">{task.progress}%</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getStatusColor(task.status)}>
                                      {getStatusText(task.status)}
                                    </Badge>
                                    {task.isReceived && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Réceptionnée
                                      </Badge>
                                    )}
                                    {task.isPaid && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Payée
                                      </Badge>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTask(category.id!, task.id!);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Task Form Fields - Collapsible */}
                              <Collapsible defaultOpen={false}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Modifier les détails</span>
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-4 space-y-4 p-4 bg-white rounded-lg border border-purple-200">
                                  {/* Task Form Fields */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-purple-900 font-medium">Équipe assignée</Label>
                                      <Select
                                        value={task.teamId}
                                        onValueChange={(value) => handleTeamChange(category.id!, task.id!, value)}
                                      >
                                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                          <SelectValue placeholder="Sélectionner une équipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id}>
                                              <div className="flex items-center">
                                                <Users className="h-4 w-4 mr-2" />
                                                {team.name} - {team.specialty}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-purple-900 font-medium">Nom de la tâche</Label>
                                      <Select
                                        value={task.name}
                                        onValueChange={(value) => handleTaskNameChange(category.id!, task.id!, value)}
                                        disabled={!task.teamId}
                                      >
                                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                          <SelectValue placeholder={task.teamId ? "Sélectionner une tâche" : "Sélectionnez d'abord une équipe"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {task.teamId && selectedTeamTasks[task.teamId]?.map((teamTask) => (
                                            <SelectItem key={teamTask.id} value={teamTask.name}>
                                              {teamTask.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-purple-900 font-medium">Description</Label>
                                    <Textarea
                                      value={task.description}
                                      onChange={(e) => updateTask(category.id!, task.id!, { description: e.target.value })}
                                      placeholder="Description de la tâche..."
                                      rows={2}
                                      className="border-purple-200 focus:border-purple-400"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <Label className="text-purple-900 font-medium">Date début prévue</Label>
                                      <Input
                                        type="date"
                                        value={task.plannedStartDate}
                                        onChange={(e) => updateTask(category.id!, task.id!, { plannedStartDate: e.target.value })}
                                        className="border-purple-200 focus:border-purple-400"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-purple-900 font-medium">Date fin prévue</Label>
                                      <Input
                                        type="date"
                                        value={task.plannedEndDate}
                                        onChange={(e) => updateTask(category.id!, task.id!, { plannedEndDate: e.target.value })}
                                        className="border-purple-200 focus:border-purple-400"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-purple-900 font-medium">Durée (jours)</Label>
                                      <Input
                                        type="number"
                                        value={task.durationDays}
                                        onChange={(e) => updateTask(category.id!, task.id!, { durationDays: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        className="border-purple-200 focus:border-purple-400"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-purple-900 font-medium">Montant (DH)</Label>
                                      <Input
                                        type="number"
                                        value={task.amount}
                                        onChange={(e) => updateTask(category.id!, task.id!, { amount: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        step="0.01"
                                        className="border-purple-200 focus:border-purple-400"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-purple-900 font-medium">Statut</Label>
                                      <Select
                                        value={task.status}
                                        onValueChange={(value) => updateTask(category.id!, task.id!, { status: value })}
                                      >
                                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PENDING">En attente</SelectItem>
                                          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                                          <SelectItem value="COMPLETED">Terminée</SelectItem>
                                          <SelectItem value="DELAYED">En retard</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-purple-900 font-medium">Progression (%)</Label>
                                      <div className="space-y-2">
                                        <Input
                                          type="number"
                                          value={task.progress}
                                          onChange={(e) => updateTask(category.id!, task.id!, { progress: parseInt(e.target.value) || 0 })}
                                          min="0"
                                          max="100"
                                          className="border-purple-200 focus:border-purple-400"
                                        />
                                        <Progress value={task.progress} className="h-2" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-purple-900 font-medium">État</Label>
                                      <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={task.isReceived}
                                            onChange={(e) => updateTask(category.id!, task.id!, { isReceived: e.target.checked })}
                                            className="rounded"
                                          />
                                          <span className="text-sm">Réceptionnée</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={task.isPaid}
                                            onChange={(e) => updateTask(category.id!, task.id!, { isPaid: e.target.checked })}
                                            className="rounded"
                                          />
                                          <span className="text-sm">Payée</span>
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-purple-900 font-medium">Remarques</Label>
                                    <Textarea
                                      value={task.remarks}
                                      onChange={(e) => updateTask(category.id!, task.id!, { remarks: e.target.value })}
                                      placeholder="Remarques sur la tâche..."
                                      rows={2}
                                      className="border-purple-200 focus:border-purple-400"
                                    />
                                  </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}

                      {(!category.tasks || category.tasks.length === 0) && (
                        <Card className="border-2 border-dashed border-gray-300">
                          <CardContent className="text-center py-8 text-gray-500">
                          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Aucune tâche dans cette catégorie</p>
                          <Button
                            variant="outline"
                            onClick={() => addTask(category.id!)}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une tâche
                          </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie</h3>
              <p className="text-gray-600 mb-4">Commencez par ajouter une catégorie à votre template</p>
              <Button onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une catégorie
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button onClick={saveTemplate} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
}