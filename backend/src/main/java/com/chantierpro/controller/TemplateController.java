package com.chantierpro.controller;

import com.chantierpro.entity.*;
import com.chantierpro.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/templates")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "true")
public class TemplateController {

    @Autowired
    private TemplateService templateService;

    @GetMapping
    public ResponseEntity<List<Template>> getAllTemplates(@RequestParam(required = false) String search) {
        List<Template> templates;
        if (search != null && !search.isEmpty()) {
            templates = templateService.searchTemplates(search);
        } else {
            templates = templateService.getAllTemplates();
        }
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Template> getTemplateById(@PathVariable Long id) {
        return templateService.getTemplateById(id)
                .map(template -> ResponseEntity.ok().body(template))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Template> createTemplate(@Valid @RequestBody Template template) {
        try {
            Template createdTemplate = templateService.createTemplate(template);
            return ResponseEntity.ok(createdTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Template> updateTemplate(@PathVariable Long id, @Valid @RequestBody Template templateDetails) {
        try {
            Template updatedTemplate = templateService.updateTemplate(id, templateDetails);
            return ResponseEntity.ok(updatedTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id) {
        try {
            templateService.deleteTemplate(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Template Categories
    @GetMapping("/{templateId}/categories")
    public ResponseEntity<List<TemplateCategory>> getCategoriesByTemplateId(@PathVariable Long templateId) {
        List<TemplateCategory> categories = templateService.getCategoriesByTemplateId(templateId);
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/{templateId}/categories")
    public ResponseEntity<TemplateCategory> createTemplateCategory(
            @PathVariable Long templateId,
            @Valid @RequestBody TemplateCategory templateCategory) {
        try {
            // Set the template reference
            Template template = templateService.getTemplateById(templateId)
                    .orElseThrow(() -> new RuntimeException("Template not found"));
            templateCategory.setTemplate(template);
            
            TemplateCategory createdCategory = templateService.createTemplateCategory(templateCategory);
            return ResponseEntity.ok(createdCategory);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<TemplateCategory> updateTemplateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody TemplateCategory categoryDetails) {
        try {
            TemplateCategory updatedCategory = templateService.updateTemplateCategory(categoryId, categoryDetails);
            return ResponseEntity.ok(updatedCategory);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<?> deleteTemplateCategory(@PathVariable Long categoryId) {
        try {
            templateService.deleteTemplateCategory(categoryId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Template Tasks
    @GetMapping("/categories/{categoryId}/tasks")
    public ResponseEntity<List<TemplateTask>> getTasksByTemplateCategoryId(@PathVariable Long categoryId) {
        List<TemplateTask> tasks = templateService.getTasksByTemplateCategoryId(categoryId);
        return ResponseEntity.ok(tasks);
    }
    
    // Get only visible tasks (hideInTemplateView = false) for template category
    @GetMapping("/categories/{categoryId}/visible-tasks")
    public ResponseEntity<List<TemplateTask>> getVisibleTasksByTemplateCategoryId(@PathVariable Long categoryId) {
        List<TemplateTask> tasks = templateService.getVisibleTasksByTemplateCategoryId(categoryId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/categories/{categoryId}/tasks")
    public ResponseEntity<TemplateTask> createTemplateTask(
            @PathVariable Long categoryId,
            @Valid @RequestBody TemplateTask templateTask) {
        try {
            // Set the template category reference
            TemplateCategory templateCategory = templateService.getCategoriesByTemplateId(null).stream()
                    .filter(cat -> cat.getId().equals(categoryId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Template category not found"));
            templateTask.setTemplateCategory(templateCategory);
            
            TemplateTask createdTask = templateService.createTemplateTask(templateTask);
            return ResponseEntity.ok(createdTask);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TemplateTask> updateTemplateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TemplateTask taskDetails) {
        try {
            TemplateTask updatedTask = templateService.updateTemplateTask(taskId, taskDetails);
            return ResponseEntity.ok(updatedTask);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<?> deleteTemplateTask(@PathVariable Long taskId) {
        try {
            templateService.deleteTemplateTask(taskId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Apply template to villa
    @PostMapping("/{templateId}/apply-to-villa/{villaId}")
    public ResponseEntity<?> applyTemplateToVilla(@PathVariable Long templateId, @PathVariable Long villaId) {
        try {
            templateService.applyTemplateToVilla(templateId, villaId);
            return ResponseEntity.ok(Map.of("message", "Template applied successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get task templates for team (for dropdown filtering)
    @GetMapping("/team/{teamId}/task-templates")
    public ResponseEntity<List<TaskTemplate>> getTaskTemplatesForTeam(@PathVariable Long teamId) {
        List<TaskTemplate> taskTemplates = templateService.getTaskTemplatesForTeam(teamId);
        return ResponseEntity.ok(taskTemplates);
    }
}