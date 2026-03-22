// src/main/java/com/example/demo/dashboard/service/DashboardService.java
package com.example.demo.dashboard.service;

import com.example.demo.dashboard.dto.*;
import com.example.demo.dashboard.dto.DashboardResponse.InventorySummary;
import com.example.demo.dashboard.dto.DashboardResponse.LowStockProductDTO;
import com.example.demo.dashboard.dto.DashboardResponse.UpcomingEventDTO;
import com.example.demo.dashboard.dto.StatsResponse.PaymentBreakdown;
import com.example.demo.order.repository.OrderItemRepository;
import com.example.demo.order.repository.OrderRepository;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.product.model.Product;
import com.example.demo.product.repository.ProductRepository;
import com.example.demo.security.TenantContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final int LOW_STOCK_THRESHOLD = 5;

    // ═══════════════════════════════════════════
    // GET /api/dashboard
    // ═══════════════════════════════════════════

    public DashboardResponse getDashboard() {

        Long tenantId = TenantContext.getTenantId();
        LocalDate today = LocalDate.now();

        // ── Rangos de fechas ──
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        LocalDate yesterday = today.minusDays(1);
        LocalDateTime startYesterday = yesterday.atStartOfDay();
        LocalDateTime endYesterday = yesterday.atTime(LocalTime.MAX);

        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDateTime startOfMonth = firstDayOfMonth.atStartOfDay();

        LocalDate firstDayPrevMonth = firstDayOfMonth.minusMonths(1);
        LocalDateTime startPrevMonth = firstDayPrevMonth.atStartOfDay();
        LocalDateTime endPrevMonth = firstDayOfMonth.minusDays(1).atTime(LocalTime.MAX);

        // ── 💰 Ventas del día ──
        BigDecimal salesToday = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, startOfDay, endOfDay));
        BigDecimal salesYesterday = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, startYesterday, endYesterday));
        Double salesTodayGrowth = calculateGrowth(salesToday, salesYesterday);

        // ── 📅 Ingresos del mes ──
        BigDecimal monthlyRevenue = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, startOfMonth, endOfDay));
        BigDecimal prevMonthRevenue = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, startPrevMonth, endPrevMonth));
        Double monthlyGrowth = calculateGrowth(monthlyRevenue, prevMonthRevenue);

        // ── 📦 Inventario ──
        InventorySummary inventory = buildInventorySummary(tenantId);

        // ── 📊 Gráfica de ventas (7 días) ──
        SalesChartDTO salesChart = buildSalesChart(tenantId, 7);

        // ── 🏆 Top paquetes del mes ──
        List<TopItemDTO> topPackages = buildTopItems(
                orderItemRepository.topPackagesByTenant(tenantId, startOfMonth, endOfDay),
                5);

        // ── 🔜 Eventos próximos (placeholder) ──
        List<UpcomingEventDTO> upcomingEvents = Collections.emptyList();

        return DashboardResponse.builder()
                .salesToday(salesToday)
                .salesYesterday(salesYesterday)
                .salesTodayGrowth(salesTodayGrowth)
                .monthlyRevenue(monthlyRevenue)
                .previousMonthRevenue(prevMonthRevenue)
                .monthlyGrowth(monthlyGrowth)
                .inventory(inventory)
                .salesChart(salesChart)
                .topPackages(topPackages)
                .upcomingEvents(upcomingEvents)
                .scheduledEventsCount(0)
                .build();
    }

    // ═══════════════════════════════════════════
    // GET /api/dashboard/stats?range=7|15|30
    // ═══════════════════════════════════════════

    public StatsResponse getStats(Integer rangeDays) {

        Long tenantId = TenantContext.getTenantId();

        if (rangeDays == null || rangeDays <= 0) rangeDays = 7;

        LocalDate today = LocalDate.now();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        LocalDate startDate = today.minusDays(rangeDays - 1);
        LocalDateTime start = startDate.atStartOfDay();

        // Periodo anterior (mismo rango)
        LocalDate prevStartDate = startDate.minusDays(rangeDays);
        LocalDateTime prevStart = prevStartDate.atStartOfDay();
        LocalDateTime prevEnd = startDate.minusDays(1).atTime(LocalTime.MAX);

        // ── 💰 Total ventas ──
        BigDecimal totalSales = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, start, endOfDay));
        BigDecimal prevTotalSales = safe(paymentRepository.sumTotalPaymentsByTenant(
                tenantId, prevStart, prevEnd));
        Double growthPercentage = calculateGrowth(totalSales, prevTotalSales);

        // ── Órdenes cerradas ──
        Long totalOrders = orderRepository.countClosedOrdersByTenant(tenantId, start, endOfDay);
        if (totalOrders == null) totalOrders = 0L;

        // ── 🎟 Ticket promedio ──
        BigDecimal averageTicket = BigDecimal.ZERO;
        if (totalOrders > 0) {
            averageTicket = totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        }

        // ── 📊 Ventas por día ──
        SalesChartDTO dailySales = buildSalesChart(tenantId, rangeDays);

        // ── 📦 Ventas por producto ──
        List<TopItemDTO> salesByProduct = buildTopItems(
                orderItemRepository.topProductsByTenant(tenantId, start, endOfDay), null);

        // ── 🎉 Ventas por paquete ──
        List<TopItemDTO> salesByPackage = buildTopItems(
                orderItemRepository.topPackagesByTenant(tenantId, start, endOfDay), null);

        // ── 🔝 Top 10 ──
        List<TopItemDTO> topProducts = buildTopItems(
                orderItemRepository.allItemsSoldByTenant(tenantId, start, endOfDay), 10);

        // ── Desglose de pagos ──
        PaymentBreakdown paymentBreakdown = buildPaymentBreakdown(tenantId, start, endOfDay);

        return StatsResponse.builder()
                .rangeDays(rangeDays)
                .dateFrom(startDate.format(DATE_FMT))
                .dateTo(today.format(DATE_FMT))
                .dailySales(dailySales)
                .salesByProduct(salesByProduct)
                .salesByPackage(salesByPackage)
                .topProducts(topProducts)
                .totalSales(totalSales)
                .averageTicket(averageTicket)
                .growthPercentage(growthPercentage)
                .totalOrders(totalOrders)
                .scheduledEvents(0)
                .paymentBreakdown(paymentBreakdown)
                .build();
    }

    // ═══════════════════════════════════════════
    // HELPERS PRIVADOS
    // ═══════════════════════════════════════════

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private Double calculateGrowth(BigDecimal current, BigDecimal previous) {
        current = safe(current);
        previous = safe(previous);

        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }

        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    // ── Inventario ──

    private InventorySummary buildInventorySummary(Long tenantId) {

        List<Product> products = productRepository.findAllByTenant_IdAndActiveTrue(tenantId);

        int totalProducts = products.size();

        int totalStock = products.stream()
                .filter(p -> p.getStock() != null)
                .mapToInt(Product::getStock)
                .sum();

        List<LowStockProductDTO> lowStock = products.stream()
                .filter(p -> p.getStock() != null
                        && p.getStock() >= 0
                        && p.getStock() <= LOW_STOCK_THRESHOLD)
                .map(p -> LowStockProductDTO.builder()
                        .publicId(p.getPublicId())
                        .name(p.getName())
                        .stock(p.getStock())
                        .build())
                .collect(Collectors.toList());

        return InventorySummary.builder()
                .totalProducts(totalProducts)
                .totalStock(totalStock)
                .lowStockCount(lowStock.size())
                .lowStockProducts(lowStock)
                .build();
    }

    // ── Gráfica de ventas ──

    private SalesChartDTO buildSalesChart(Long tenantId, int days) {

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);

        List<Object[]> raw = paymentRepository.dailySalesByTenant(tenantId, start, end);

        // Crear mapa fecha → monto
        Map<LocalDate, BigDecimal> salesMap = new LinkedHashMap<>();
        for (Object[] row : raw) {
            LocalDate date = parseDate(row[0]);
            BigDecimal amount = toBigDecimal(row[1]);
            salesMap.put(date, amount);
        }

        List<String> labels = new ArrayList<>();
        List<BigDecimal> data = new ArrayList<>();
        List<String> fullDates = new ArrayList<>();

        Locale locale = Locale.of("es", "MX");

        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);

            String label;
            if (days > 7) {
                label = date.format(DateTimeFormatter.ofPattern("dd/MM"));
            } else {
                DayOfWeek dow = date.getDayOfWeek();
                label = dow.getDisplayName(TextStyle.SHORT, locale);
                label = label.substring(0, 1).toUpperCase() + label.substring(1);
            }

            labels.add(label);
            data.add(salesMap.getOrDefault(date, BigDecimal.ZERO));
            fullDates.add(date.format(DATE_FMT));
        }

        return SalesChartDTO.builder()
                .labels(labels)
                .data(data)
                .fullDates(fullDates)
                .build();
    }

    // ── Top items ──

    private List<TopItemDTO> buildTopItems(List<Object[]> raw, Integer limit) {

        List<TopItemDTO> items = new ArrayList<>();

        for (Object[] row : raw) {
            items.add(TopItemDTO.builder()
                    .publicId((String) row[0])
                    .name((String) row[1])
                    .quantitySold(((Number) row[2]).longValue())
                    .totalRevenue(toBigDecimal(row[3]))
                    .build());
        }

        if (limit != null && items.size() > limit) {
            return items.subList(0, limit);
        }

        return items;
    }

    // ── Desglose por método de pago ──

    private PaymentBreakdown buildPaymentBreakdown(
            Long tenantId, LocalDateTime start, LocalDateTime end) {

        try {
            Object[] breakdown = paymentRepository.paymentBreakdownByTenant(
                    tenantId, start, end);

            if (breakdown != null && breakdown.length >= 3) {
                return PaymentBreakdown.builder()
                        .cashTotal(toBigDecimal(breakdown[0]))
                        .cardTotal(toBigDecimal(breakdown[1]))
                        .transferTotal(toBigDecimal(breakdown[2]))
                        .build();
            }
        } catch (Exception e) {
            log.warn("Error al obtener desglose de pagos: {}", e.getMessage());
        }

        return PaymentBreakdown.builder()
                .cashTotal(BigDecimal.ZERO)
                .cardTotal(BigDecimal.ZERO)
                .transferTotal(BigDecimal.ZERO)
                .build();
    }

    // ── Utilidades de conversión (native queries devuelven tipos variados) ──

    private LocalDate parseDate(Object value) {
        if (value instanceof LocalDate) return (LocalDate) value;
        if (value instanceof java.sql.Date) return ((java.sql.Date) value).toLocalDate();
        if (value instanceof java.sql.Timestamp)
            return ((java.sql.Timestamp) value).toLocalDateTime().toLocalDate();
        return LocalDate.parse(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return new BigDecimal(value.toString());
    }
}