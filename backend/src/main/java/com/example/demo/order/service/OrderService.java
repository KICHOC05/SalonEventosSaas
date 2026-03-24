package com.example.demo.order.service;

import com.example.demo.security.TenantContext;
import com.example.demo.common.enums.OrderStatus;
import com.example.demo.common.enums.ProductType;
import com.example.demo.common.enums.InventoryMode;
import com.example.demo.common.enums.OrderItemStatus;
import com.example.demo.order.dto.*;
import com.example.demo.order.model.Order;
import com.example.demo.order.model.OrderItem;
import com.example.demo.order.repository.OrderItemRepository;
import com.example.demo.order.repository.OrderRepository;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.product.model.Product;
import com.example.demo.product.repository.ProductRepository;
import com.example.demo.settings.model.TaxSettings;
import com.example.demo.settings.model.TenantSettings;
import com.example.demo.settings.repository.TaxSettingsRepository;
import com.example.demo.settings.repository.TenantSettingsRepository;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import com.example.demo.branch.model.Branch;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    private final PaymentRepository paymentRepository;
    private final TaxSettingsRepository taxSettingsRepository;
    private final TenantSettingsRepository tenantSettingsRepository;

    // =========================
    // CREATE ORDER
    // =========================

    public OrderResponse createOrder(OrderCreateRequest request) {

        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();
        Long userId = TenantContext.getUserId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Order order = new Order();

        order.setTenant(tenant);
        order.setBranch(branch);
        order.setUser(user);

        order.setCustomerName(request.getCustomerName());
        order.setChildName(request.getChildName());

        order.setStatus(OrderStatus.OPEN);
        order.setSubtotal(BigDecimal.ZERO);
        order.setTax(BigDecimal.ZERO);
        order.setTotalAmount(BigDecimal.ZERO);

        orderRepository.save(order);

        return mapToResponse(order);
    }

    // =========================
    // ADD ITEM
    // =========================

    public OrderResponse addItem(String orderPublicId, OrderItemRequest request) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(orderPublicId, tenantId);

        Product product = productRepository
                .findByPublicIdAndTenant_IdAndActiveTrue(
                        request.getProductPublicId(),
                        tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        TenantSettings settings = tenantSettingsRepository
                .findByTenant_Id(tenantId)
                .orElse(null);

        InventoryMode mode = settings != null
                ? settings.getInventoryMode()
                : InventoryMode.WARNING;

        Integer stock = product.getStock();
        String warning = null;

        if (stock != null && stock < request.getQuantity()) {

            switch (mode) {

                case STRICT -> throw new IllegalStateException(
                        "Stock insuficiente para el producto: " + product.getName());

                case WARNING -> warning = "Producto vendido sin stock";

                case DISABLED -> {
                }
            }
        }

        OrderItem item = new OrderItem();

        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(request.getQuantity());
        item.setUnitPrice(product.getPrice());
        item.setStatus(OrderItemStatus.ACTIVE);

        // =========================
        // HOURLY TIMER
        // =========================

    if (product.getType() == ProductType.SERVICE) {

        LocalDateTime now = LocalDateTime.now();

        item.setSessionStart(now);
        item.setDurationMinutes(product.getDurationMinutes());

        item.setSessionEnd(now.plusMinutes(product.getDurationMinutes()));
        item.setActive(true);
    }

        BigDecimal subtotal = product.getPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        item.setSubtotal(subtotal);
        item.setWarning(warning);

        orderItemRepository.save(item);

        if (mode != InventoryMode.DISABLED && product.getStock() != null) {

            product.setStock(product.getStock() - request.getQuantity());
            productRepository.save(product);

        }

        recalculateOrder(order);

        return getOrder(orderPublicId);
    }

    // =========================
    // VOID ITEM
    // =========================

    public OrderResponse voidItem(String orderPublicId, String itemPublicId) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(orderPublicId, tenantId);

        OrderItem item = orderItemRepository
                .findByPublicId(itemPublicId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));

        if (!item.getOrder().getPublicId().equals(orderPublicId)) {

            throw new IllegalStateException("El item no pertenece a esta orden");

        }

        if (item.getStatus() == OrderItemStatus.VOIDED) {

            throw new IllegalStateException("El item ya fue anulado");

        }

        Product product = item.getProduct();

        if (product.getStock() != null) {

            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);

        }

        item.setStatus(OrderItemStatus.VOIDED);

        orderItemRepository.save(item);

        recalculateOrder(order);

        return getOrder(orderPublicId);
    }

    // =========================
    // UPDATE ITEM QUANTITY
    // =========================

    public OrderResponse updateItemQuantity(
            String orderPublicId,
            String itemPublicId,
            UpdateOrderItemRequest request) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(orderPublicId, tenantId);

        OrderItem item = orderItemRepository
                .findByPublicId(itemPublicId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));

        Product product = item.getProduct();

        int oldQty = item.getQuantity();
        int newQty = request.getQuantity();
        int difference = newQty - oldQty;

        if (product.getStock() != null) {

            product.setStock(product.getStock() - difference);
            productRepository.save(product);

        }

        item.setQuantity(newQty);

        BigDecimal subtotal = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(newQty));

        item.setSubtotal(subtotal);

        orderItemRepository.save(item);

        recalculateOrder(order);

        return getOrder(orderPublicId);
    }

    // =========================
    // CLOSE ORDER
    // =========================

    public OrderResponse closeOrder(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(publicId, tenantId);

        BigDecimal paid = paymentRepository.sumPaymentsByOrderId(order.getId());

        if (paid == null) paid = BigDecimal.ZERO;

        if (paid.compareTo(order.getTotalAmount()) < 0) {

            throw new IllegalStateException("Pago incompleto");

        }

        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());

        orderRepository.save(order);

        return mapToResponse(order);
    }

    // =========================
    // CANCEL ORDER
    // =========================

    public OrderResponse cancelOrder(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(publicId, tenantId);

        List<OrderItem> items = orderItemRepository.findAllByOrder_Id(order.getId());

        for (OrderItem item : items) {

            if (item.getStatus() == OrderItemStatus.ACTIVE) {

                Product product = item.getProduct();

                if (product.getStock() != null) {

                    product.setStock(product.getStock() + item.getQuantity());
                    productRepository.save(product);

                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);

        orderRepository.save(order);

        return mapToResponse(order);
    }

    // =========================
    // GET ORDER
    // =========================

    public OrderResponse getOrder(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Order order = getOrderEntity(publicId, tenantId);

        return mapToResponse(order);
    }

    // =========================
    // PRIVATE METHODS
    // =========================

    private Order getOrderEntity(String publicId, Long tenantId) {

        return orderRepository
                .findByPublicIdAndTenant_Id(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
    }

    private void recalculateOrder(Order order) {

        Long tenantId = TenantContext.getTenantId();

        TaxSettings taxSettings = taxSettingsRepository
                .findByTenant_Id(tenantId)
                .orElse(null);

        BigDecimal subtotal = orderItemRepository
                .findAllByOrder_Id(order.getId())
                .stream()
                .filter(item -> item.getStatus() == OrderItemStatus.ACTIVE)
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal tax = BigDecimal.ZERO;

        if (taxSettings != null && Boolean.TRUE.equals(taxSettings.getTaxEnabled())) {

            tax = subtotal.multiply(taxSettings.getTaxRate());

        }

        BigDecimal total = subtotal.add(tax);

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setTotalAmount(total);

        orderRepository.save(order);
    }

    private OrderResponse mapToResponse(Order order) {

        List<OrderItemResponse> items = orderItemRepository
                .findAllByOrder_Id(order.getId())
                .stream()
                .map(item -> {

                    OrderItemResponse response = new OrderItemResponse();

                    response.setPublicId(item.getPublicId());
                    response.setProductPublicId(item.getProduct().getPublicId());
                    response.setProductName(item.getProduct().getName());
                    response.setQuantity(item.getQuantity());
                    response.setUnitPrice(item.getUnitPrice());
                    response.setSubtotal(item.getSubtotal());
                    response.setWarning(item.getWarning());
                    response.setStatus(item.getStatus().name());
                    response.setDurationMinutes(item.getDurationMinutes());
                    response.setActive(item.getActive());
                    response.setSessionStart(item.getSessionStart());
                    response.setSessionEnd(item.getSessionEnd());
    
                    return response;

                }).toList();

        OrderResponse response = new OrderResponse();

        response.setPublicId(order.getPublicId());
        response.setStatus(order.getStatus());
        response.setCustomerName(order.getCustomerName());
        response.setChildName(order.getChildName());
        response.setSubtotal(order.getSubtotal());
        response.setTax(order.getTax());
        response.setTotalAmount(order.getTotalAmount());
        response.setCreatedAt(order.getCreatedAt());
        response.setClosedAt(order.getClosedAt());
        response.setItems(items);

        return response;
    }
}
