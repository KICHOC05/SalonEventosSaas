package com.example.demo.event.repository;

import com.example.demo.common.enums.EventStatus;
import com.example.demo.event.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

    List<Event> findAllByTenant_IdAndEventDateOrderByStartTime(Long tenantId, LocalDate eventDate);

    @Query("SELECT e FROM Event e WHERE e.tenant.id = :tenantId " +
           "AND e.eventDate BETWEEN :start AND :end ORDER BY e.eventDate, e.startTime")
    List<Event> findAllByTenantIdAndDateRange(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT e FROM Event e WHERE e.tenant.id = :tenantId " +
           "AND e.eventDate = :date AND e.status <> 'CANCELLED' " +
           "AND e.startTime < :endTime AND e.endTime > :startTime")
    List<Event> findOverlapping(
            @Param("tenantId") Long tenantId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    List<Event> findAllByTenant_IdAndEventDateBetweenAndStatus(
            Long tenantId, LocalDate start, LocalDate end, EventStatus status);

    List<Event> findAllByTenant_IdAndEventDateBetween(
            Long tenantId, LocalDate start, LocalDate end);

    long countByTenant_IdAndEventDateBetween(Long tenantId, LocalDate start, LocalDate end);

    long countByTenant_IdAndEventDateBetweenAndStatus(
            Long tenantId, LocalDate start, LocalDate end, EventStatus status);

    @Query("SELECT COUNT(e) FROM Event e WHERE e.tenant.id = :tenantId AND e.eventDate >= :from AND e.status <> 'CANCELLED'")
    long countByTenantWithDateAfter(@Param("tenantId") Long tenantId, @Param("from") LocalDate from);

    @Query("SELECT e FROM Event e WHERE e.tenant.id = :tenantId AND e.eventDate >= :from AND e.status <> 'CANCELLED' ORDER BY e.eventDate, e.startTime")
    List<Event> findNextUpcomingByTenant(@Param("tenantId") Long tenantId, @Param("from") LocalDate from);
}
