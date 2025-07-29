'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-spinner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { 
    sidebarOpen, 
    projects, 
    selectedProject,
    setSelectedProject,
    setLoading,
    setTemplates,
  } = useStore();

  const { toast } = useToast();
  const hasInitialized = useRef(false);

  // Initialize with real data from API
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    const fetchData = async () => {
      hasInitialized.current = true;
      setLoading(true);
      try {
        // Fetch projects
        const fetchedProjects = await apiService.getProjects();
        console.log('Fetched projects:', fetchedProjects);
        
        // Process projects data
        const processedProjects = fetchedProjects.map(project => ({
          ...project,
          id: project.id.toString(),
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate)
        }));

        // Update store with all projects at once
        useStore.setState(state => ({
          projects: processedProjects
        }));
        
        // Set default selected project
        if (processedProjects.length > 0 && !selectedProject) {
          const defaultProject = processedProjects[0];
          setSelectedProject(defaultProject);
          
          toast({
            title: 'Projet sélectionné',
            description: `${defaultProject.name} a été sélectionné par défaut.`,
          });
        }
        
        // Fetch villas for the selected project
        try {
          if (processedProjects.length > 0) {
            const defaultProjectId = processedProjects[0].id.toString();
            console.log('Fetching villas for project:', defaultProjectId);
            
            // Explicitly fetch villas for the default project
            const fetchedVillas = await apiService.getVillas(defaultProjectId);
            console.log('Fetched villas from API:', fetchedVillas);
            
            if (Array.isArray(fetchedVillas)) {
              console.log(`Found ${fetchedVillas.length} villas for project ${defaultProjectId}`);
              
              // Process villas data
              const processedVillas = fetchedVillas.map((villa: any) => ({
                ...villa,
                id: villa.id.toString(),
                projectId: defaultProjectId,
                lastModified: villa.lastModified instanceof Date ? 
                  villa.lastModified : new Date(villa.lastModified)
              }));

              // Update store with all villas at once
              useStore.setState(state => ({
                villas: processedVillas
              }));
            } else {
              console.error('Fetched villas is not an array:', fetchedVillas);
            }
          }
        }
        catch (villasError) {
          console.error('Failed to fetch villas:', villasError);
          toast({
            title: 'Erreur de chargement des villas',
            description: 'Impossible de charger les villas. Veuillez réessayer.',
            variant: 'destructive',
          });
        }
        
        // Fetch categories for all villas
        try {
          console.log('Fetching all categories');
          const fetchedCategories = await apiService.getCategories();
          console.log('Fetched categories from API:', fetchedCategories);
          
          if (Array.isArray(fetchedCategories)) {
            console.log(`Found ${fetchedCategories.length} categories`);
            
            // Process categories data
            const processedCategories = fetchedCategories.map((category: any) => ({
              ...category,
              id: category.id.toString(),
              villaId: category.villaId ? category.villaId.toString() : 
                      (category.villa && category.villa.id ? category.villa.id.toString() : null),
              startDate: category.startDate instanceof Date ? 
                category.startDate : new Date(category.startDate),
              endDate: category.endDate instanceof Date ? 
                category.endDate : new Date(category.endDate)
            }));

            // Update store with all categories at once
            useStore.setState(state => ({
              categories: processedCategories
            }));
          } else {
            console.error('Fetched categories is not an array:', fetchedCategories);
          }
        } catch (categoriesError) {
          console.error('Failed to fetch categories:', categoriesError);
          toast({
            title: 'Erreur de chargement des catégories',
            description: 'Impossible de charger les catégories. Veuillez réessayer.',
            variant: 'destructive',
          });
        }
        
        // Fetch teams
        try {
          console.log('Fetching teams');
          const fetchedTeams = await apiService.getTeams();
          console.log('Fetched teams from API:', fetchedTeams);
          
          if (Array.isArray(fetchedTeams)) {
            console.log(`Found ${fetchedTeams.length} teams`);
            
            // Process teams data
            const processedTeams = fetchedTeams.map((team: any) => ({
              ...team,
              id: team.id.toString(),
              lastActivity: team.lastActivity instanceof Date ? 
                team.lastActivity : new Date(team.lastActivity)
            }));

            // Update store with all teams at once
            useStore.setState(state => ({
              teams: processedTeams
            }));
          } else {
            console.error('Fetched teams is not an array:', fetchedTeams);
          }
        } catch (teamsError) {
          console.error('Failed to fetch teams:', teamsError);
          toast({
            title: 'Erreur de chargement des équipes',
            description: 'Impossible de charger les équipes. Veuillez réessayer.',
            variant: 'destructive',
          });
        }
        
        // Fetch templates
        try {
          console.log('Fetching templates');
          const fetchedTemplates = await apiService.getAllTemplates();
          console.log('Fetched templates from API:', fetchedTemplates);
          
          if (Array.isArray(fetchedTemplates)) {
            console.log(`Found ${fetchedTemplates.length} templates`);
            
            // Process templates data
            const processedTemplates = fetchedTemplates.map((template: any) => ({
              ...template,
              id: template.id.toString(),
              createdAt: template.createdAt instanceof Date ? 
                template.createdAt : new Date(template.createdAt),
              updatedAt: template.updatedAt instanceof Date ? 
                template.updatedAt : new Date(template.updatedAt),
              // Ensure categories structure is correct
              categories: (template.categories || []).map((category: any) => ({
                ...category,
                startDate: category.startDate instanceof Date ? 
                  category.startDate : new Date(category.startDate),
                endDate: category.endDate instanceof Date ? 
                  category.endDate : new Date(category.endDate),
                tasks: category.tasks || []
              }))
            }));
            
            setTemplates(processedTemplates);
          } else {
            console.error('Fetched templates is not an array:', fetchedTemplates);
          }
        } catch (templatesError) {
          console.error('Failed to fetch templates:', templatesError);
          toast({
            title: 'Erreur de chargement des templates',
            description: 'Impossible de charger les templates. Veuillez réessayer.',
            variant: 'destructive',
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch data from API:', error);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les données du serveur.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array is fine now since we use useRef to prevent re-runs

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <LoadingOverlay />
      <Sidebar />
      <Navbar />
      
      <main 
        className={cn(
          'pt-16 transition-all duration-300 min-h-screen',
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
        )}
      >
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}