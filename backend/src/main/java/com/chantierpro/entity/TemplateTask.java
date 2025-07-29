package com.chantierpro.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "template_tasks")
public class TemplateTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Template category is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_category_id", nullable = false)
    @JsonBackReference
    private TemplateCategory templateCategory;

    @NotBlank(message = "Task name is required")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    @JsonIgnoreProperties({"tasks", "hibernateLazyInitializer", "handler"})
    private Team team;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Task.TaskStatus status = Task.TaskStatus.PENDING;

    @Column(nullable = false)
    private Integer progress = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "progress_status", nullable = false)
    private Task.ProgressStatus progressStatus = Task.ProgressStatus.ON_SCHEDULE;

    @Column(name = "is_received", nullable = false)
    private Boolean isReceived = false;

    @Column(name = "is_paid", nullable = false)
    private Boolean isPaid = false;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "hide_in_template_view")
    private Boolean hideInTemplateView = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public TemplateTask() {}

    public TemplateTask(TemplateCategory templateCategory, String name, Team team) {
        this.templateCategory = templateCategory;
        this.name = name;
        this.team = team;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TemplateCategory getTemplateCategory() { return templateCategory; }
    public void setTemplateCategory(TemplateCategory templateCategory) { this.templateCategory = templateCategory; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public LocalDate getPlannedStartDate() { return plannedStartDate; }
    public void setPlannedStartDate(LocalDate plannedStartDate) { this.plannedStartDate = plannedStartDate; }

    public LocalDate getPlannedEndDate() { return plannedEndDate; }
    public void setPlannedEndDate(LocalDate plannedEndDate) { this.plannedEndDate = plannedEndDate; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public Task.TaskStatus getStatus() { return status; }
    public void setStatus(Task.TaskStatus status) { this.status = status; }

    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }

    public Task.ProgressStatus getProgressStatus() { return progressStatus; }
    public void setProgressStatus(Task.ProgressStatus progressStatus) { this.progressStatus = progressStatus; }

    public Boolean getIsReceived() { return isReceived; }
    public void setIsReceived(Boolean isReceived) { this.isReceived = isReceived; }

    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean isPaid) { this.isPaid = isPaid; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    
    public Boolean getHideInTemplateView() { return hideInTemplateView; }
    public void setHideInTemplateView(Boolean hideInTemplateView) { this.hideInTemplateView = hideInTemplateView; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper method to get team ID
    @Transient
    public Long getTeamId() {
        return team != null ? team.getId() : null;
    }
}