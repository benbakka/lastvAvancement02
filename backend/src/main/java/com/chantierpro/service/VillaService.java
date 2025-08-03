package com.chantierpro.service;

import com.chantierpro.entity.Category;
import com.chantierpro.entity.Villa;
import com.chantierpro.entity.Project;
import com.chantierpro.repository.VillaRepository;
import com.chantierpro.repository.ProjectRepository;
import com.chantierpro.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class VillaService {

    @Autowired
    private VillaRepository villaRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProjectService projectService;

    public List<Villa> getAllVillas() {
        return villaRepository.findAll();
    }

    public List<Villa> getVillasByProjectId(Long projectId) {
        return villaRepository.findByProjectId(projectId);
    }

    public Optional<Villa> getVillaById(Long id) {
        return villaRepository.findById(id);
    }

    public Villa createVilla(Villa villa) {
        Project project = projectRepository.findById(villa.getProject().getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        villa.setProject(project);
        Villa savedVilla = villaRepository.save(villa);
        
        // Update project stats
        projectService.updateProjectStats(project.getId());
        
        return savedVilla;
    }

    public Villa updateVilla(Long id, Villa villaDetails) {
        Villa villa = villaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Villa not found with id: " + id));

        villa.setName(villaDetails.getName());
        villa.setType(villaDetails.getType());
        villa.setSurface(villaDetails.getSurface());
        villa.setProgress(villaDetails.getProgress());
        villa.setStatus(villaDetails.getStatus());

        Villa savedVilla = villaRepository.save(villa);
        
        // Update project stats
        projectService.updateProjectStats(villa.getProject().getId());
        
        return savedVilla;
    }

    public void deleteVilla(Long id) {
        Villa villa = villaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Villa not found with id: " + id));
        
        Long projectId = villa.getProject().getId();
        villaRepository.delete(villa);
        
        // Update project stats
        projectService.updateProjectStats(projectId);
    }

    public List<Villa> searchVillas(Long projectId, String searchTerm) {
        if (projectId != null) {
            return villaRepository.findByProjectIdAndNameOrTypeContaining(projectId, searchTerm);
        }
        return villaRepository.findByNameContainingIgnoreCase(searchTerm);
    }

    public List<Villa> getVillasByStatus(Villa.VillaStatus status) {
        return villaRepository.findByStatus(status);
    }

    /**
     * Updates the statistics for a villa including progress calculation
     * Progress is calculated as the average of all categories' progression values
     * 
     * @param villaId The ID of the villa to update
     */
    @Transactional
    public void updateVillaStats(Long villaId) {
        try {
            Villa villa = villaRepository.findById(villaId)
                    .orElseThrow(() -> new RuntimeException("Villa not found with id: " + villaId));

            // Update categories count
            Long categoriesCount = categoryRepository.countByVillaId(villaId);
            villa.setCategoriesCount(categoriesCount.intValue());

            // Update completed categories count
            Long completedCategories = categoryRepository.countCompletedByVillaId(villaId);
            villa.setCompletedCategories(completedCategories.intValue());

            // Calculate progress as average of all categories' progression values
            if (categoriesCount > 0) {
                List<Category> categories = categoryRepository.findByVillaId(villaId);
                
                if (!categories.isEmpty()) {
                    int totalProgress = 0;
                    int validCategoryCount = 0;
                    
                    // Calculate total progress while handling null values and validating ranges
                    for (Category category : categories) {
                        Integer categoryProgress = category.getProgress();
                        
                        // Skip null progress values
                        if (categoryProgress == null) continue;
                        
                        // Ensure progress value is within valid range (0-100)
                        categoryProgress = Math.max(0, Math.min(100, categoryProgress));
                        
                        totalProgress += categoryProgress;
                        validCategoryCount++;
                    }
                    
                    // Calculate average progress only if there are valid categories with progress values
                    int averageProgress = validCategoryCount > 0 ? totalProgress / validCategoryCount : 0;
                    
                    System.out.println("Villa " + villa.getName() + " progress calculated: " + 
                            averageProgress + "% from " + validCategoryCount + " valid categories out of " + 
                            categories.size() + " total");
                    
                    villa.setProgress(averageProgress);
                    
                    // Update status based on progress
                    updateVillaStatusBasedOnProgress(villa, averageProgress);
                } else {
                    // No categories found, set progress to 0
                    villa.setProgress(0);
                    villa.setStatus(Villa.VillaStatus.NOT_STARTED);
                }
            } else {
                // No categories counted, set progress to 0
                villa.setProgress(0);
                villa.setStatus(Villa.VillaStatus.NOT_STARTED);
            }

            villaRepository.save(villa);
            
            // Update project stats if the villa has a valid project
            if (villa.getProject() != null && villa.getProject().getId() != null) {
                projectService.updateProjectStats(villa.getProject().getId());
            }
        } catch (Exception e) {
            System.err.println("Error updating villa stats for ID " + villaId + ": " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to maintain transaction semantics
        }
    }
    
    /**
     * Helper method to update a villa's status based on its progress percentage
     * 
     * @param villa The villa to update
     * @param progress The calculated progress percentage
     */
    private void updateVillaStatusBasedOnProgress(Villa villa, int progress) {
        if (progress == 100) {
            villa.setStatus(Villa.VillaStatus.COMPLETED);
        } else if (progress > 50) {
            villa.setStatus(Villa.VillaStatus.IN_PROGRESS);
        } else {
            villa.setStatus(Villa.VillaStatus.NOT_STARTED);
        }
    }
}