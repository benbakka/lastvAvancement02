package com.chantierpro.service;

import com.chantierpro.entity.Project;
import com.chantierpro.entity.Villa;
import com.chantierpro.repository.ProjectRepository;
import com.chantierpro.repository.VillaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private VillaRepository villaRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAllOrderByCreatedAtDesc();
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        project.setName(projectDetails.getName());
        project.setType(projectDetails.getType());
        project.setLocation(projectDetails.getLocation());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        project.setStatus(projectDetails.getStatus());
        project.setProgress(projectDetails.getProgress());
        project.setPicProject(projectDetails.getPicProject());

        return projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    public List<Project> searchProjects(String searchTerm) {
        return projectRepository.findByNameOrLocationContaining(searchTerm);
    }

    public List<Project> getProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.findByStatus(status);
    }

    /**
     * Updates the statistics for a project including progress calculation
     * Progress is calculated as the average of all villas' progression values
     * 
     * @param projectId The ID of the project to update
     */
    @Transactional
    public void updateProjectStats(Long projectId) {
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

            // Update villas count
            Long villasCount = villaRepository.countByProjectId(projectId);
            project.setVillasCount(villasCount.intValue());

            // Calculate overall progress as average of all villas' progression values
            if (villasCount > 0) {
                // Get all villas for this project
                List<Villa> villas = villaRepository.findByProjectId(projectId);
                
                if (!villas.isEmpty()) {
                    int totalProgress = 0;
                    int validVillaCount = 0;
                    
                    // Calculate total progress while handling null values and validating ranges
                    for (Villa villa : villas) {
                        Integer villaProgress = villa.getProgress();
                        
                        // Skip null progress values
                        if (villaProgress == null) continue;
                        
                        // Ensure progress value is within valid range (0-100)
                        villaProgress = Math.max(0, Math.min(100, villaProgress));
                        
                        totalProgress += villaProgress;
                        validVillaCount++;
                    }
                    
                    // Calculate average progress only if there are valid villas with progress values
                    int averageProgress = validVillaCount > 0 ? totalProgress / validVillaCount : 0;
                    
                    System.out.println("Project " + project.getName() + " progress calculated: " + 
                            averageProgress + "% from " + validVillaCount + " valid villas out of " + 
                            villas.size() + " total");
                    
                    project.setProgress(averageProgress);
                    
                    // Update project status based on progress
                    updateProjectStatusBasedOnProgress(project, averageProgress);
                } else {
                    // No villas found, set progress to 0
                    project.setProgress(0);
                    project.setStatus(Project.ProjectStatus.DRAFT);
                }
            } else {
                // No villas counted, set progress to 0
                project.setProgress(0);
                project.setStatus(Project.ProjectStatus.DRAFT);
            }

            projectRepository.save(project);
        } catch (Exception e) {
            System.err.println("Error updating project stats for ID " + projectId + ": " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to maintain transaction semantics
        }
    }
    
    /**
     * Helper method to update a project's status based on its progress percentage
     * 
     * @param project The project to update
     * @param progress The calculated progress percentage
     */
    private void updateProjectStatusBasedOnProgress(Project project, int progress) {
        if (progress == 100) {
            project.setStatus(Project.ProjectStatus.COMPLETED);
        } else if (progress > 0) {
            project.setStatus(Project.ProjectStatus.ACTIVE);
        } else {
            project.setStatus(Project.ProjectStatus.DRAFT);
        }
    }
}