package com.chantierpro.repository;

import com.chantierpro.entity.TemplateTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateTaskRepository extends JpaRepository<TemplateTask, Long> {
    
    List<TemplateTask> findByTemplateCategoryId(Long templateCategoryId);
    
    @Query("SELECT tt FROM TemplateTask tt WHERE tt.templateCategory.id = ?1 ORDER BY tt.createdAt ASC")
    List<TemplateTask> findByTemplateCategoryIdOrderByCreatedAt(Long templateCategoryId);
    
    @Query("SELECT tt FROM TemplateTask tt WHERE tt.templateCategory.id = ?1 AND (tt.hideInTemplateView = false OR tt.hideInTemplateView IS NULL) ORDER BY tt.createdAt ASC")
    List<TemplateTask> findVisibleByTemplateCategoryIdOrderByCreatedAt(Long templateCategoryId);
    
    @Query("SELECT tt FROM TemplateTask tt WHERE tt.team.id = ?1")
    List<TemplateTask> findByTeamId(Long teamId);
    
    @Query("SELECT tt FROM TemplateTask tt WHERE tt.templateCategory.template.id = ?1")
    List<TemplateTask> findByTemplateId(Long templateId);
}