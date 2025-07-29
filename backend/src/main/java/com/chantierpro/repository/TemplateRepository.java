package com.chantierpro.repository;

import com.chantierpro.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {
    
    List<Template> findByNameContainingIgnoreCase(String name);
    
    @Query("SELECT t FROM Template t ORDER BY t.updatedAt DESC")
    List<Template> findAllOrderByUpdatedAtDesc();
    
    @Query("SELECT t FROM Template t ORDER BY t.createdAt DESC")
    List<Template> findAllOrderByCreatedAtDesc();
}