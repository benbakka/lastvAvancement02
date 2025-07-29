package com.chantierpro.repository;

import com.chantierpro.entity.TemplateCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateCategoryRepository extends JpaRepository<TemplateCategory, Long> {
    
    List<TemplateCategory> findByTemplateId(Long templateId);
    
    @Query("SELECT tc FROM TemplateCategory tc WHERE tc.template.id = ?1 ORDER BY tc.createdAt ASC")
    List<TemplateCategory> findByTemplateIdOrderByCreatedAt(Long templateId);
}