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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCategory {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
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
  const [categories, setCategories] = useState<TemplateCategory[]>(formData?.categories || []);
  const [selectedTeamTasks, setSelectedTeamTasks] = useState<Record<string, any[]>>({});

  // Load existing template if editing
  useEffect(() => {
    if (formData) {
      // Use formData passed from parent component
      console.log('Using formData from parent:', formData);
      setTemplateName(formData.name || '');
      setTemplateDescription(formData.description || '');
      setCategories(formData.categories || []);
    } else if (templateId) {
      // Fall back to loading from API if no formData provided
      loadTemplate(templateId);
    }
  }, [templateId, formData]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      // Load template data from API
      const template = await apiService.getTemplateById(id);
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      
      // Load categories and tasks
      const templateCategories = await apiService.getCategoriesByTemplateId(id);
      const categoriesWithTasks = await Promise.all(
        templateCategories.map(async (category: any) => {
          const tasks = await apiService.getTasksByTemplateCategoryId(category.id);
          return {
            ...category,
            tasks: tasks || [],
            isExpanded: true
          };
        })
      );
      
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

  // Load team tasks when team is selected
  const loadTeamTasks = async (teamId: string) => {
    if (selectedTeamTasks[teamId]) return; // Already loaded

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
    
    // Find the task in the current category
    const category = categories.find(cat => cat.id === categoryId);
    const task = category?.tasks.find(t => t.id === taskId);
    
    if (task && task.teamId) {
      // Find the selected team task template to get default values
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

      // Prepare template data
      const templateData = {
        name: templateName,
        description: templateDescription,
        categories: categories.map(category => ({
          name: category.name,
          startDate: category.startDate,
          endDate: category.endDate,
          tasks: category.tasks.map(task => ({
            name: task.name,
            description: task.description,
            teamId: task.teamId ? parseInt(task.teamId) : null,
            plannedStartDate: task.plannedStartDate,
            plannedEndDate: task.plannedEndDate,
            durationDays: task.durationDays,
            status: task.status,
            progress: task.progress,
            progressStatus: task.progressStatus,
            isReceived: task.isReceived,
            isPaid: task.isPaid,
            amount: task.amount,
            remarks: task.remarks,
            // Add a flag to hide tasks in the main template view
            hideInTemplateView: true
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

  return (
    <div className="space-y-6">
      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            {templateId ? 'Modifier le Template' : 'Créer un Template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName">Nom du template</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Villa Standard, Appartement Type A"
              />
            </div>
            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Description du template..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories and Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Catégories et Tâches
            </CardTitle>
            <Button onClick={addCategory} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category, categoryIndex) => (
              <Card key={category.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Collapsible
                      open={category.isExpanded}
                      onOpenChange={() => toggleCategoryExpansion(category.id!)}
                      className="flex-1"
                    >
                      <CollapsibleTrigger className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded">
                        {category.isExpanded ? (
                          <ChevronDown key="expanded" className="h-4 w-4" />
                        ) : (
                          <ChevronRight key="collapsed" className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {category.name || `Catégorie ${categoryIndex + 1}`}
                        </span>
                        <Badge variant="outline">
                          {category.tasks?.length || 0} tâche(s)
                        </Badge>
                      </CollapsibleTrigger>
                    </Collapsible>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(category.id!)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tâche
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Collapsible
                    open={category.isExpanded}
                    onOpenChange={() => toggleCategoryExpansion(category.id!)}
                  >
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <Label>Nom de la catégorie</Label>
                          <Input
                            value={category.name}
                            onChange={(e) => updateCategory(category.id!, { name: e.target.value })}
                            placeholder="Ex: Gros Œuvre, Plomberie"
                          />
                        </div>
                        <div>
                          <Label>Date de début</Label>
                          <Input
                            type="date"
                            value={category.startDate}
                            onChange={(e) => updateCategory(category.id!, { startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Date de fin</Label>
                          <Input
                            type="date"
                            value={category.endDate}
                            onChange={(e) => updateCategory(category.id!, { endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardHeader>

                <Collapsible
                  open={category.isExpanded}
                  onOpenChange={() => toggleCategoryExpansion(category.id!)}
                >
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {(category.tasks || []).map((task, taskIndex) => (
                          <Card key={task.id} className="bg-gray-50 border-dashed">
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium flex items-center">
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    Tâche #{taskIndex + 1}
                                  </h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteTask(category.id!, task.id!)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Équipe assignée</Label>
                                    <Select
                                      value={task.teamId}
                                      onValueChange={(value) => handleTeamChange(category.id!, task.id!, value)}
                                    >
                                      <SelectTrigger>
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
                                    <Label>Nom de la tâche</Label>
                                    <Select
                                      value={task.name}
                                      onValueChange={(value) => handleTaskNameChange(category.id!, task.id!, value)}
                                      disabled={!task.teamId}
                                    >
                                      <SelectTrigger>
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
                                  <Label>Description</Label>
                                  <Textarea
                                    value={task.description}
                                    onChange={(e) => updateTask(category.id!, task.id!, { description: e.target.value })}
                                    placeholder="Description de la tâche..."
                                    rows={2}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <Label>Date début prévue</Label>
                                    <Input
                                      type="date"
                                      value={task.plannedStartDate}
                                      onChange={(e) => updateTask(category.id!, task.id!, { plannedStartDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Date fin prévue</Label>
                                    <Input
                                      type="date"
                                      value={task.plannedEndDate}
                                      onChange={(e) => updateTask(category.id!, task.id!, { plannedEndDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Durée (jours)</Label>
                                    <Input
                                      type="number"
                                      value={task.durationDays}
                                      onChange={(e) => updateTask(category.id!, task.id!, { durationDays: parseInt(e.target.value) || 0 })}
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Montant (DH)</Label>
                                    <Input
                                      type="number"
                                      value={task.amount}
                                      onChange={(e) => updateTask(category.id!, task.id!, { amount: parseFloat(e.target.value) || 0 })}
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label>Statut</Label>
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) => updateTask(category.id!, task.id!, { status: value })}
                                    >
                                      <SelectTrigger>
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
                                    <Label>Progression (%)</Label>
                                    <div className="space-y-2">
                                      <Input
                                        type="number"
                                        value={task.progress}
                                        onChange={(e) => updateTask(category.id!, task.id!, { progress: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        max="100"
                                      />
                                      <Progress value={task.progress} className="h-2" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>État</Label>
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
                                  <Label>Remarques</Label>
                                  <Textarea
                                    value={task.remarks}
                                    onChange={(e) => updateTask(category.id!, task.id!, { remarks: e.target.value })}
                                    placeholder="Remarques sur la tâche..."
                                    rows={2}
                                  />
                                </div>

                                {/* Task Summary */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center space-x-4">
                                    <Badge className={getStatusColor(task.status)}>
                                      {getStatusText(task.status)}
                                    </Badge>
                                    {task.isReceived && (
                                      <Badge variant="outline" className="text-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Réceptionnée
                                      </Badge>
                                    )}
                                    {task.isPaid && (
                                      <Badge variant="outline" className="text-blue-600">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Payée
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {task.durationDays} jour(s) • {task.amount.toLocaleString()} DH
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {(!category.tasks || category.tasks.length === 0) && (
                          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
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
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Aucune catégorie</h3>
                <p className="mb-4">Commencez par ajouter une catégorie à votre template</p>
                <Button onClick={addCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une catégorie
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button onClick={saveTemplate} disabled={loading}>
          {loading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
}