package com.carpenter.controller;

import com.carpenter.dto.request.ProjectRequest;
import com.carpenter.dto.request.ProjectUpdateRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.ProjectResponse;
import com.carpenter.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.ok(ApiResponse.success("Project initialized successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long id) {
        ProjectResponse response = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", response));
    }

    @GetMapping("/quote/{quoteId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectByQuote(@PathVariable Long quoteId) {
        ProjectResponse response = projectService.getProjectByQuoteId(quoteId);
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", response));
    }

    @GetMapping("/inquiry/{inquiryId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectByInquiry(@PathVariable Long inquiryId) {
        ProjectResponse response = projectService.getProjectByInquiryId(inquiryId);
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", response));
    }

    @PostMapping("/{id}/updates")
    public ResponseEntity<ApiResponse<ProjectResponse>> addUpdate(
            @PathVariable Long id,
            @RequestBody ProjectUpdateRequest request) {
        ProjectResponse response = projectService.addUpdate(id, request);
        return ResponseEntity.ok(ApiResponse.success("Project update added successfully", response));
    }
}
