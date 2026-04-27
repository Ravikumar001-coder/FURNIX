package com.carpenter.repository;

import com.carpenter.model.GalleryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GalleryRepository extends JpaRepository<GalleryItem, Long> {

    Page<GalleryItem> findByActiveTrue(Pageable pageable);

    @Query("""
        SELECT g FROM GalleryItem g
        WHERE g.active = true
        AND (:category IS NULL OR g.category = :category)
        AND (:roomType IS NULL OR g.roomType = :roomType)
        AND (:material IS NULL OR LOWER(g.materialsUsed) LIKE LOWER(CONCAT('%', :material, '%')))
        ORDER BY g.featured DESC, g.displayOrder ASC, g.createdAt DESC
        """)
    Page<GalleryItem> findWithFilters(
        @Param("category") String category,
        @Param("roomType") String roomType,
        @Param("material") String material,
        Pageable pageable
    );

    List<GalleryItem> findByActiveTrueAndFeaturedTrueOrderByDisplayOrderAsc();
}
