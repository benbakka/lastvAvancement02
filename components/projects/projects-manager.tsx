'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Home
} from 'lucide-react';
import { Project } from '@/lib/types';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';

export function ProjectsManager() {
  const { projects, villas, addProject, updateProject, deleteProject, setSelectedProject, setLoading, setSidebarOpen } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    picProject: ''
  });
  
  // For file upload handling
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      
      // Process image if selected
      let picProjectUrl = '';
      if (selectedImage) {
        // Convert image to base64 for storage
        picProjectUrl = await convertImageToBase64(selectedImage);
      }
      
      const projectData = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'PAUSED',
        progress: 0,
        villasCount: 0,
        alertsCount: 0,
        picProject: picProjectUrl // Add the image URL
      };

      // Call the API to create the project
      const createdProject = await apiService.createProject(projectData);
      
      // Add the created project to the store with proper date objects
      addProject({
        ...createdProject,
        startDate: new Date(createdProject.startDate),
        endDate: new Date(createdProject.endDate),
        picProject: picProjectUrl // Ensure the image is included
      });
      
      toast({
        title: 'Projet créé',
        description: 'Le projet a été créé avec succès.',
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le projet.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    
    try {
      setLoading(true);
      
      // Process image if selected
      let picProjectUrl = editingProject.picProject || '';
      if (selectedImage) {
        // Convert image to base64 for storage
        picProjectUrl = await convertImageToBase64(selectedImage);
        console.log('Image converted to base64, length:', picProjectUrl.length);
      }
      
      // Create a clean project data object with only the fields we want to update
      const projectData = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        picProject: picProjectUrl // Add or update the image URL
      };

      console.log('Updating project with data:', {
        id: editingProject.id,
        name: projectData.name,
        type: projectData.type,
        picProjectLength: projectData.picProject ? projectData.picProject.length : 0
      });

      try {
        // Call the API to update the project with a timeout
        const updatedProject = await Promise.race<Project>([
          apiService.updateProject(editingProject.id, projectData),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Update request timed out')), 15000)
          )
        ]);
        
        console.log('Project updated successfully:', updatedProject);
        
        // Update the project in the store with proper date objects
        updateProject(editingProject.id, {
          ...updatedProject,
          startDate: new Date(updatedProject.startDate),
          endDate: new Date(updatedProject.endDate),
          picProject: picProjectUrl // Ensure the image is included
        });
        
        toast({
          title: 'Projet mis à jour',
          description: 'Le projet a été mis à jour avec succès.',
        });
        
        // Force close the dialog
        setEditingProject(null);
        resetForm();
      } catch (updateError) {
        console.error('Error during project update API call:', updateError);
        toast({
          title: 'Erreur de mise à jour',
          description: 'Le projet n\'a pas pu être mis à jour. Veuillez réessayer.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le projet.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a preview URL for the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSelectedImage(file);
  };
  
  // Convert image to base64 for storage with aggressive compression
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Always compress images regardless of size
      console.log(`Processing image of size ${file.size} bytes...`);
      
      // Create a canvas to resize and compress the image
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        // Reduce max dimension to 800px (smaller than before)
        const maxDimension = 800; 
        
        if (width > height && width > maxDimension) {
          height = Math.floor((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.floor((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Set canvas dimensions and draw resized image
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with more aggressive compression
        const quality = 0.5; // Lower quality for smaller file size
        const base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Log compression results
        const originalSize = file.size;
        const compressedSize = Math.round(base64.length * 0.75); // Approximate size in bytes
        const compressionRatio = Math.round((originalSize / compressedSize) * 100) / 100;
        console.log(`Compressed image from ${originalSize} bytes to ${compressedSize} bytes (${compressionRatio}x reduction)`);
        
        // If the image is still too large (over 500KB), compress further
        if (compressedSize > 500 * 1024) {
          console.log('Image still too large, applying additional compression...');
          // Create a second pass with even smaller dimensions and quality
          const canvas2 = document.createElement('canvas');
          const ctx2 = canvas2.getContext('2d');
          const maxDimension2 = 600; // Even smaller max dimension
          
          let width2 = width;
          let height2 = height;
          
          if (width2 > height2 && width2 > maxDimension2) {
            height2 = Math.floor((height2 * maxDimension2) / width2);
            width2 = maxDimension2;
          } else if (height2 > maxDimension2) {
            width2 = Math.floor((width2 * maxDimension2) / height2);
            height2 = maxDimension2;
          }
          
          canvas2.width = width2;
          canvas2.height = height2;
          ctx2?.drawImage(canvas, 0, 0, width2, height2);
          
          const quality2 = 0.3; // Even lower quality
          const base64Final = canvas2.toDataURL('image/jpeg', quality2);
          
          const finalSize = Math.round(base64Final.length * 0.75);
          console.log(`Second pass compression: ${compressedSize} bytes to ${finalSize} bytes`);
          resolve(base64Final);
        } else {
          resolve(base64);
        }
      };
      
      img.onerror = (error: Event | string) => {
        reject(error);
      };
      
      // Load the file into the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      picProject: ''
    });
    setSelectedImage(null);
    setImagePreview('');
  };
  
  // Handle project click to navigate to dashboard
  const handleProjectClick = (project: Project) => {
    // Set the selected project in the store
    setSelectedProject(project);
    
    // Close the sidebar
    setSidebarOpen(false);
    
    // Navigate to the dashboard
    router.push('/dashboard');
  };
  
  // Handle view project button click
  const handleViewProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent onClick from firing
    setViewingProject(project);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      type: project.type,
      location: project.location,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate.toISOString().split('T')[0],
      description: '',
      picProject: project.picProject || ''
    });
    
    // Set image preview if project has an image
    if (project.picProject) {
      setImagePreview(project.picProject);
    } else {
      setImagePreview('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'COMPLETED': return 'Terminé';
      case 'PAUSED': return 'En pause';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Créez et gérez vos projets de construction</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du projet</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Résidence Les Oliviers"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Ex: Résidentiel, Commercial"
                />
              </div>
              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Casablanca, Rabat"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Image Upload Field */}
              <div>
                <Label htmlFor="projectImage">Image du projet</Label>
                <div className="mt-1 flex items-center gap-4">
                  <Input
                    id="projectImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                      <div 
                        className="w-full h-full bg-cover bg-center" 
                        style={{ backgroundImage: `url(${imagePreview})` }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Choisissez une image pour représenter ce projet</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateProject}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher un projet par nom, type ou localisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 py-6 text-base rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, index) => {
          // Use uploaded image if available, otherwise use a data URI for a default image
          let projectImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIGR1IHByb2pldDwvdGV4dD48L3N2Zz4=';
          
          if (project.picProject) {
            // Use the custom uploaded image from database
            projectImage = project.picProject;
          }
          
          return (
            <div 
              key={`project-list-${project.id}-${index}-${Math.random().toString(36).substring(2, 9)}`} 
              className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              {/* Project Image with Zoom Effect */}
              <div className="relative h-64 w-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transform transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${projectImage})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                
                {/* Status Badge */}
                <Badge className={`absolute top-4 right-4 ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </Badge>
                
                {/* Project Title - Positioned at bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>{project.type}</span>
                  </div>
                </div>
              </div>
              
              {/* Project Details */}
              <div className="p-6 space-y-4">
                {/* Location */}
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{project.location}</span>
                </div>
                
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Avancement</span>
                    <span className="font-bold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 bg-gray-100" />
                </div>
                
                {/* Project Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">{project.villasCount} villas</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{project.startDate.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'})}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProject(project, e);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(project);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white hover:bg-gray-50"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        setLoading(true);
                        // Call the API to delete the project
                        await apiService.deleteProject(project.id);
                        // Remove from local state
                        deleteProject(project.id);
                        toast({
                          title: 'Projet supprimé',
                          description: 'Le projet a été supprimé avec succès.',
                        });
                      } catch (error) {
                        console.error('Failed to delete project:', error);
                        toast({
                          title: 'Erreur',
                          description: 'Impossible de supprimer le projet.',
                          variant: 'destructive'
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Alerts (if any) */}
                {project.alertsCount > 0 && (
                  <div className="flex items-center justify-center w-full py-2 px-3 bg-red-50 text-red-700 rounded-md mt-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>{project.alertsCount} alertes</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center">
            <Building2 className="h-16 w-16 text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun projet trouvé</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {searchTerm ? 'Aucun projet ne correspond à votre recherche.' : 'Commencez par créer votre premier projet immobilier.'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom du projet</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Localisation</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Date de début</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">Date de fin</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            {/* Image Upload Field */}
            <div>
              <Label htmlFor="edit-projectImage">Image du projet</Label>
              <div className="mt-1 flex items-center gap-4">
                <Input
                  id="edit-projectImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {imagePreview && (
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                    <div 
                      className="w-full h-full bg-cover bg-center" 
                      style={{ backgroundImage: `url(${imagePreview})` }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Choisissez une image pour représenter ce projet</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateProject}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Détails du projet: {viewingProject?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Type</Label>
                      <p className="text-lg font-semibold">{viewingProject.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Localisation</Label>
                      <p className="text-lg font-semibold flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {viewingProject.location}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Statut</Label>
                      <Badge className={getStatusColor(viewingProject.status)}>
                        {getStatusText(viewingProject.status)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Avancement</Label>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{viewingProject.progress}%</p>
                        <Progress value={viewingProject.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Date de début</Label>
                      <p className="text-lg font-semibold flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {viewingProject.startDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Date de fin</Label>
                      <p className="text-lg font-semibold flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {viewingProject.endDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{viewingProject.villasCount}</div>
                      <div className="text-sm text-blue-600">Villas totales</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {villas.filter(v => v.projectId === viewingProject.id && v.status === 'completed').length}
                      </div>
                      <div className="text-sm text-green-600">Villas terminées</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {villas.filter(v => v.projectId === viewingProject.id && v.status === 'in_progress').length}
                      </div>
                      <div className="text-sm text-orange-600">Villas en cours</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{viewingProject.alertsCount}</div>
                      <div className="text-sm text-red-600">Alertes actives</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Villas */}
              <Card>
                <CardHeader>
                  <CardTitle>Villas du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {villas.filter(v => v.projectId === viewingProject.id).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Aucune villa dans ce projet</p>
                    ) : (
                      villas.filter(v => v.projectId === viewingProject.id).map((villa) => (
                        <div key={`villa-${villa.id}`} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{villa.name}</h4>
                            <Badge className={getStatusColor(villa.status)}>
                              {getStatusText(villa.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <p className="font-medium">{villa.type}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Surface:</span>
                              <p className="font-medium">{villa.surface}m²</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Catégories:</span>
                              <p className="font-medium">{villa.categoriesCount}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Tâches:</span>
                              <p className="font-medium">{villa.tasksCount}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Avancement</span>
                              <span>{villa.progress}%</span>
                            </div>
                            <Progress value={villa.progress} className="h-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedProject(viewingProject);
                    setViewingProject(null);
                    setSidebarOpen(false);
                    router.push('/dashboard');
                  }}
                >
                  Sélectionner ce projet
                </Button>
                <Button onClick={() => setViewingProject(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}