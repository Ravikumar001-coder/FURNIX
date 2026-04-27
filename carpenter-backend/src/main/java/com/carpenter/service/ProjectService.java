package com.carpenter.service;

import com.carpenter.dto.request.ProjectRequest;
import com.carpenter.dto.request.ProjectUpdateRequest;
import com.carpenter.dto.response.ProjectResponse;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.*;
import com.carpenter.repository.ProjectRepository;
import com.carpenter.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final QuoteRepository quoteRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        Quote quote = quoteRepository.findById(request.getQuoteId())
                .orElseThrow(() -> new ResourceNotFoundException("Quote", request.getQuoteId()));

        Project project = Project.builder()
                .quote(quote)
                .currentStage(request.getInitialStage() != null ? request.getInitialStage() : ProjectStage.INQUIRY)
                .startDate(request.getStartDate())
                .expectedCompletionDate(request.getExpectedCompletionDate())
                .build();

        // Add initial update
        ProjectUpdate initialUpdate = ProjectUpdate.builder()
                .project(project)
                .stage(project.getCurrentStage())
                .comment("Project initialized.")
                .build();
        project.getUpdates().add(initialUpdate);

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Transactional
    public ProjectResponse addUpdate(Long projectId, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        ProjectUpdate update = ProjectUpdate.builder()
                .project(project)
                .stage(request.getStage())
                .comment(request.getComment())
                .imageUrl(request.getImageUrl())
                .build();

        project.getUpdates().add(update);
        project.setCurrentStage(request.getStage());
        
        if (request.getStage() == ProjectStage.DELIVERED) {
            project.setActualCompletionDate(java.time.LocalDate.now());
        }

        Project saved = projectRepository.save(project);

        // Notify customer of progress
        notificationService.notifyStatusUpdate(
            saved.getQuote().getInquiry().getEmail(), 
            saved.getCurrentStage().name()
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        return mapToResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectByQuoteId(Long quoteId) {
        Project project = projectRepository.findByQuoteId(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Project for Quote", quoteId));
        return mapToResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectByInquiryId(Long inquiryId) {
        Project project = projectRepository.findByQuoteInquiryId(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Project for Inquiry", inquiryId));
        return mapToResponse(project);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .quoteId(project.getQuote().getId())
                .customerName(project.getQuote().getInquiry().getName())
                .currentStage(project.getCurrentStage())
                .startDate(project.getStartDate())
                .expectedCompletionDate(project.getExpectedCompletionDate())
                .actualCompletionDate(project.getActualCompletionDate())
                .createdAt(project.getCreatedAt())
                .updates(project.getUpdates().stream()
                        .map(u -> ProjectResponse.UpdateResponse.builder()
                                .id(u.getId())
                                .stage(u.getStage())
                                .comment(u.getComment())
                                .imageUrl(u.getImageUrl())
                                .createdAt(u.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
