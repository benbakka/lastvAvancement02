'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  FolderOpen,
  Calendar,
  ClipboardList,
  Wrench
} from 'lucide-react';
import { Template } from '@/lib/types';
import { TemplateCreator } from './template-creator';

export function TemplatesManager() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingTemplateData, setEditingTemplateData] = useState<any>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = (template: any) => {
    // Ensure dates are properly converted to Date objects
    const templateWithDates = {
      ...template,
      createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
      // Ensure categories have proper date objects
      categories: (template.categories || []).map((category: any) => ({
        ...category,
        startDate: category.startDate ? new Date(category.startDate) : null,
        endDate: category.endDate ? new Date(category.endDate) : null,
        tasks: (category.tasks || []).map((task: any) => ({
          ...task,
          plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : null,
          plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : null,
        }))
      }))
    };
    
    addTemplate(templateWithDates);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTemplate = (template: any) => {
    if (editingTemplate) {
      // Ensure dates are properly converted to Date objects
      const templateWithDates = {
        ...template,
        createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
        updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
        // Ensure categories have proper date objects
        categories: (template.categories || []).map((category: any) => ({
          ...category,
          startDate: category.startDate ? new Date(category.startDate) : null,
          endDate: category.endDate ? new Date(category.endDate) : null,
          tasks: (category.tasks || []).map((task: any) => ({
            ...task,
            plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : null,
            plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : null,
          }))
        }))
      };
      
      updateTemplate(editingTemplate.id, templateWithDates);
      setEditingTemplate(null);
      setEditingTemplateData(null);
    }
  };

  const openEditDialog = async (template: Template) => {
    try {
      setLoading(true);
      
      // Load full template data with categories and tasks
      const fullTemplate = await apiService.getTemplateById(template.id);
      const templateCategories = await apiService.getCategoriesByTemplateId(template.id);
      
      // Load tasks for each category
      const categoriesWithTasks = await Promise.all(
        templateCategories.map(async (category: any) => {
          const tasks = await apiService.getTasksByTemplateCategoryId(category.id);
          return {
            ...category,
            // Ensure dates are Date objects for proper handling
            startDate: category.startDate ? new Date(category.startDate) : null,
            endDate: category.endDate ? new Date(category.endDate) : null,
            tasks: (tasks || []).map((task: any) => ({
              ...task,
              // Ensure task dates are Date objects
              plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : null,
              plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : null,
              // Ensure numeric fields are properly typed
              durationDays: typeof task.durationDays === 'number' ? task.durationDays : (parseInt(task.durationDays) || 7),
              amount: typeof task.amount === 'number' ? task.amount : (parseFloat(task.amount) || 0),
              progress: typeof task.progress === 'number' ? task.progress : (parseInt(task.progress) || 0),
              // Ensure teamId is a string
              teamId: task.teamId ? task.teamId.toString() : '',
            }))
          };
        })
      );

      const templateData = {
        ...fullTemplate,
        // Ensure template dates are Date objects
        createdAt: fullTemplate.createdAt ? new Date(fullTemplate.createdAt) : new Date(),
        updatedAt: fullTemplate.updatedAt ? new Date(fullTemplate.updatedAt) : new Date(),
        categories: categoriesWithTasks
      };

      console.log('Loaded template data for editing:', templateData);
      
      setEditingTemplate(template);
      setEditingTemplateData(templateData);
    } catch (error) {
      console.error('Failed to load template for editing:', error);
      alert('Erreur lors du chargement du template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        await apiService.deleteTemplate(templateId);
        deleteTemplate(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Erreur lors de la suppression du template');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Templates</h1>
          <p className="text-gray-600 mt-1">Créez et gérez vos templates de projet</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau template</DialogTitle>
            </DialogHeader>
            <TemplateCreator
              onSave={handleCreateTemplate}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
              <div className="text-sm text-gray-600">Templates totaux</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {templates.reduce((sum, t) => sum + (t.categories?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Catégories totales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {templates.reduce((sum, t) => 
                  sum + (t.categories?.reduce((catSum, cat) => catSum + (cat.tasks?.length || 0), 0) || 0), 0
                )}
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
                  <Wrench className="h-5 w-5 mr-2" />
                  {template.name}
                </CardTitle>
                <Badge variant="outline">
                  {template.categories?.length || 0} catégories
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {template.description}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Catégories:</span>
                    <div className="font-semibold">{template.categories?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tâches:</span>
                    <div className="font-semibold">
                      {template.categories?.reduce((sum, cat) => 
                        sum + (cat.tasks?.length || 0), 0
                      ) || 0}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Créé le {template.createdAt.toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewingTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(template)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun template trouvé</h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm ? 'Aucun template ne correspond à votre recherche.' : 'Commencez par créer votre premier template.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => {
        setEditingTemplate(null);
        setEditingTemplateData(null);
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
          </DialogHeader>
          {editingTemplate && editingTemplateData && (
            <TemplateCreator
              templateId={editingTemplate.id}
              formData={editingTemplateData}
              onSave={handleUpdateTemplate}
              onCancel={() => {
                setEditingTemplate(null);
                setEditingTemplateData(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Détails du template: {viewingTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingTemplate && (
            <div className="space-y-6">
              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nom</span>
                      <p className="text-lg font-semibold">{viewingTemplate.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description</span>
                      <p className="text-lg font-semibold">{viewingTemplate.description}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Créé le</span>
                      <p className="text-lg font-semibold flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {viewingTemplate.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Catégories et tâches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!viewingTemplate.categories || viewingTemplate.categories.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Aucune catégorie définie</p>
                    ) : (
                      viewingTemplate.categories.map((category, index) => (
                        <div key={`view-category-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center">
                              <ClipboardList className="h-4 w-4 mr-2" />
                              {category.name}
                            </h4>
                            <Badge variant="outline">
                              {category.tasks?.length || 0} tâches
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {category.tasks?.map((task, taskIndex) => (
                              <div key={`view-task-${taskIndex}`} className="ml-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-sm text-gray-900">{task.name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {task.amount ? `${task.amount.toLocaleString()} DH` : 'N/A'}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {task.durationDays && (
                                    <span>Durée: {task.durationDays} jours</span>
                                  )}
                                  {task.status && (
                                    <Badge variant="secondary" className="text-xs">
                                      {task.status === 'pending' ? 'En attente' :
                                       task.status === 'in_progress' ? 'En cours' :
                                       task.status === 'completed' ? 'Terminée' :
                                       task.status === 'delayed' ? 'En retard' : task.status}
                                    </Badge>
                                  )}
                                  {task.progress !== undefined && (
                                    <span>Progression: {task.progress}%</span>
                                  )}
                                </div>
                              </div>
                            )) || (
                              <p className="text-gray-500 text-sm ml-4">Aucune tâche dans cette catégorie</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}