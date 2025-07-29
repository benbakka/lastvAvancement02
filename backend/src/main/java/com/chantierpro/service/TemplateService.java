package com.chantierpro.service;

import com.chantierpro.entity.*;
import com.chantierpro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TemplateService {

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private TemplateCategoryRepository templateCategoryRepository;

    @Autowired
    private TemplateTaskRepository templateTaskRepository;

    @Autowired
    private VillaRepository villaRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private TaskService taskService;

    public List<Template> getAllTemplates() {
        return templateRepository.findAllOrderByUpdatedAtDesc();
    }

    public Optional<Template> getTemplateById(Long id) {
        return templateRepository.findById(id);
    }

    public List<Template> searchTemplates(String searchTerm) {
        return templateRepository.findByNameContainingIgnoreCase(searchTerm);
    }

    public Template createTemplate(Template template) {
        return templateRepository.save(template);
    }

    public Template updateTemplate(Long id, Template templateDetails) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

        template.setName(templateDetails.getName());
        template.setDescription(templateDetails.getDescription());

        return templateRepository.save(template);
    }

    public void deleteTemplate(Long id) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
        templateRepository.delete(template);
    }

    // Template Category methods
    public List<TemplateCategory> getCategoriesByTemplateId(Long templateId) {
        return templateCategoryRepository.findByTemplateIdOrderByCreatedAt(templateId);
    }

    public TemplateCategory createTemplateCategory(TemplateCategory templateCategory) {
        return templateCategoryRepository.save(templateCategory);
    }

    public TemplateCategory updateTemplateCategory(Long id, TemplateCategory categoryDetails) {
        TemplateCategory category = templateCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template category not found with id: " + id));

        category.setName(categoryDetails.getName());
        category.setStartDate(categoryDetails.getStartDate());
        category.setEndDate(categoryDetails.getEndDate());

        return templateCategoryRepository.save(category);
    }

    public void deleteTemplateCategory(Long id) {
        TemplateCategory category = templateCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template category not found with id: " + id));
        templateCategoryRepository.delete(category);
    }

    // Template Task methods
    public List<TemplateTask> getTasksByTemplateCategoryId(Long templateCategoryId) {
        return templateTaskRepository.findByTemplateCategoryIdOrderByCreatedAt(templateCategoryId);
    }
    
    // Get only visible tasks (hideInTemplateView = false) for template category
    public List<TemplateTask> getVisibleTasksByTemplateCategoryId(Long templateCategoryId) {
        return templateTaskRepository.findVisibleByTemplateCategoryIdOrderByCreatedAt(templateCategoryId);
    }

    public TemplateTask createTemplateTask(TemplateTask templateTask) {
        return templateTaskRepository.save(templateTask);
    }

    public TemplateTask updateTemplateTask(Long id, TemplateTask taskDetails) {
        TemplateTask task = templateTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template task not found with id: " + id));

        task.setName(taskDetails.getName());
        task.setDescription(taskDetails.getDescription());
        task.setTeam(taskDetails.getTeam());
        task.setPlannedStartDate(taskDetails.getPlannedStartDate());
        task.setPlannedEndDate(taskDetails.getPlannedEndDate());
        task.setDurationDays(taskDetails.getDurationDays());
        task.setStatus(taskDetails.getStatus());
        task.setProgress(taskDetails.getProgress());
        task.setProgressStatus(taskDetails.getProgressStatus());
        task.setIsReceived(taskDetails.getIsReceived());
        task.setIsPaid(taskDetails.getIsPaid());
        task.setAmount(taskDetails.getAmount());
        task.setRemarks(taskDetails.getRemarks());

        return templateTaskRepository.save(task);
    }

    public void deleteTemplateTask(Long id) {
        TemplateTask task = templateTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template task not found with id: " + id));
        templateTaskRepository.delete(task);
    }

    /**
     * Apply a template to a villa - creates categories and tasks from template
     */
    @Transactional
    public void applyTemplateToVilla(Long templateId, Long villaId) {
        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        Villa villa = villaRepository.findById(villaId)
                .orElseThrow(() -> new RuntimeException("Villa not found with id: " + villaId));

        System.out.println("Applying template '" + template.getName() + "' to villa '" + villa.getName() + "'");

        // Get template categories
        List<TemplateCategory> templateCategories = getCategoriesByTemplateId(templateId);
        System.out.println("Found " + templateCategories.size() + " categories in template");

        for (TemplateCategory templateCategory : templateCategories) {
            // Create actual category from template
            Category category = new Category();
            category.setVilla(villa);
            category.setName(templateCategory.getName());
            category.setStartDate(templateCategory.getStartDate());
            category.setEndDate(templateCategory.getEndDate());
            category.setProgress(0);
            category.setStatus(Category.CategoryStatus.ON_SCHEDULE);
            category.setTasksCount(0);
            category.setCompletedTasks(0);

            Category savedCategory = categoryRepository.save(category);
            System.out.println("Created category: " + savedCategory.getName() + " (ID: " + savedCategory.getId() + ")");

            // Get template tasks for this category
            List<TemplateTask> templateTasks = getTasksByTemplateCategoryId(templateCategory.getId());
            System.out.println("Found " + templateTasks.size() + " tasks in category '" + templateCategory.getName() + "'");

            for (TemplateTask templateTask : templateTasks) {
                // Create actual task from template
                Task task = new Task();
                task.setCategory(savedCategory);
                task.setVilla(villa);
                task.setName(templateTask.getName());
                task.setDescription(templateTask.getDescription());
                task.setTeam(templateTask.getTeam());
                
                // Set dates - use template dates or calculate from duration
                if (templateTask.getPlannedStartDate() != null) {
                    task.setPlannedStartDate(templateTask.getPlannedStartDate());
                    task.setStartDate(templateTask.getPlannedStartDate());
                } else {
                    task.setPlannedStartDate(LocalDate.now());
                    task.setStartDate(LocalDate.now());
                }

                if (templateTask.getPlannedEndDate() != null) {
                    task.setPlannedEndDate(templateTask.getPlannedEndDate());
                    task.setEndDate(templateTask.getPlannedEndDate());
                } else if (templateTask.getDurationDays() != null) {
                    LocalDate endDate = task.getPlannedStartDate().plusDays(templateTask.getDurationDays());
                    task.setPlannedEndDate(endDate);
                    task.setEndDate(endDate);
                } else {
                    LocalDate endDate = task.getPlannedStartDate().plusDays(7); // Default 7 days
                    task.setPlannedEndDate(endDate);
                    task.setEndDate(endDate);
                }

                task.setStatus(templateTask.getStatus());
                task.setProgress(templateTask.getProgress());
                task.setProgressStatus(templateTask.getProgressStatus());
                task.setIsReceived(templateTask.getIsReceived());
                task.setIsPaid(templateTask.getIsPaid());
                task.setAmount(templateTask.getAmount());
                task.setRemarks(templateTask.getRemarks());

                Task savedTask = taskRepository.save(task);
                System.out.println("Created task: " + savedTask.getName() + " (ID: " + savedTask.getId() + ")");
            }

            // Update category stats after adding tasks
            categoryService.updateCategoryStats(savedCategory.getId());
        }

        System.out.println("Template application completed successfully");
    }

    /**
     * Get available task templates for a specific team
     */
    public List<TaskTemplate> getTaskTemplatesForTeam(Long teamId) {
        return templateTaskRepository.findByTeamId(teamId).stream()
                .map(templateTask -> {
                    TaskTemplate taskTemplate = new TaskTemplate();
                    taskTemplate.setId(templateTask.getId());
                    taskTemplate.setName(templateTask.getName());
                    taskTemplate.setDescription(templateTask.getDescription());
                    taskTemplate.setDurationDays(templateTask.getDurationDays());
                    taskTemplate.setDefaultAmount(templateTask.getAmount());
                    return taskTemplate;
                })
                .toList();
    }
}