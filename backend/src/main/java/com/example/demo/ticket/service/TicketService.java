package com.example.demo.ticket.service;

import com.example.demo.branch.model.Branch;
import com.example.demo.common.enums.OrderItemStatus;
import com.example.demo.order.model.Order;
import com.example.demo.order.model.OrderItem;
import com.example.demo.order.repository.OrderItemRepository;
import com.example.demo.order.repository.OrderRepository;
import com.example.demo.payment.model.Payment;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.security.TenantContext;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.user.model.User;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

        private final OrderRepository orderRepository;
        private final OrderItemRepository orderItemRepository;
        private final PaymentRepository paymentRepository;

        @Transactional(readOnly = true)
        public String generateTicket(String publicId) {

                Long tenantId = TenantContext.getTenantId();

                Order order = orderRepository
                                .findByPublicIdAndTenant_Id(publicId, tenantId)
                                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

                Tenant tenant = order.getTenant();
                Branch branch = order.getBranch();
                User cashier = order.getUser();

                List<OrderItem> items = orderItemRepository.findAllByOrder_Id(order.getId());
                List<OrderItem> activeItems = items.stream()
                                .filter(i -> i.getStatus() == OrderItemStatus.ACTIVE)
                                .toList();

                List<Payment> payments = paymentRepository.findAllByOrder_Id(order.getId());

                BigDecimal totalApplied = payments.stream()
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalReceived = payments.stream()
                                .map(p -> p.getAmountReceived() != null
                                                ? p.getAmountReceived()
                                                : p.getAmount())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalChange = payments.stream()
                                .map(p -> p.getChangeAmount() != null
                                                ? p.getChangeAmount()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                String businessName = tenant.getBusinessName() != null
                                ? tenant.getBusinessName()
                                : "Mi Empresa";
                String logoUrl = tenant.getLogoUrl() != null ? tenant.getLogoUrl() : "";
                String tenantPhone = tenant.getPhone() != null ? tenant.getPhone() : "";
                String tenantWebsite = tenant.getWebsite() != null ? tenant.getWebsite() : "";

                String branchName = branch.getName() != null ? branch.getName() : "";
                String branchAddress = branch.getAddress() != null ? branch.getAddress() : "";
                String branchPhone = branch.getPhone() != null ? branch.getPhone() : "";

                StringBuilder ticket = new StringBuilder();

                ticket.append("""
                                <html>
                                <head>
                                <meta charset="UTF-8">
                                <style>
                                body{
                                    font-family: 'Courier New', monospace;
                                    width: 300px;
                                    margin: 0 auto;
                                    padding: 10px;
                                    font-size: 12px;
                                }
                                .center{text-align:center;}
                                .right{text-align:right;}
                                .bold{font-weight:bold;}
                                .line{border-top:1px dashed #333; margin:8px 0;}
                                .item{display:flex; justify-content:space-between; margin:2px 0;}
                                .item-detail{font-size:10px; color:#666; margin-left:10px;}
                                img.logo{width:120px; margin:auto; display:block; margin-bottom:5px;}
                                .payment-box{
                                    background:#f5f5f5;
                                    padding:8px;
                                    margin:5px 0;
                                    border-radius:4px;
                                }
                                .change-box{
                                    border:2px solid #000;
                                    padding:8px;
                                    margin:8px 0;
                                    text-align:center;
                                    font-size:16px;
                                    font-weight:bold;
                                }
                                .total-line{font-size:14px; font-weight:bold;}
                                </style>
                                </head>
                                <body>
                                """);

                ticket.append("<div class='center'>");

                if (!logoUrl.isEmpty()) {
                        ticket.append("<img class='logo' src='")
                                        .append(escapeHtml(logoUrl)).append("'/>");
                }

                ticket.append("<div class='bold' style='font-size:14px;'>")
                                .append(escapeHtml(businessName)).append("</div>");

                if (!branchName.isEmpty()) {
                        ticket.append("<div>").append(escapeHtml(branchName)).append("</div>");
                }
                if (!branchAddress.isEmpty()) {
                        ticket.append("<div style='font-size:10px;'>")
                                        .append(escapeHtml(branchAddress)).append("</div>");
                }

                String phone = !branchPhone.isEmpty() ? branchPhone : tenantPhone;
                if (!phone.isEmpty()) {
                        ticket.append("<div style='font-size:10px;'>Tel: ")
                                        .append(escapeHtml(phone)).append("</div>");
                }
                if (!tenantWebsite.isEmpty()) {
                        ticket.append("<div style='font-size:10px;'>")
                                        .append(escapeHtml(tenantWebsite)).append("</div>");
                }

                ticket.append("</div>");

                ticket.append("<div class='line'></div>");

                String orderId = order.getPublicId().length() > 8
                                ? order.getPublicId().substring(0, 8).toUpperCase()
                                : order.getPublicId().toUpperCase();

                ticket.append("<div class='item'><span>Orden:</span><span>")
                                .append(orderId).append("</span></div>");
                ticket.append("<div class='item'><span>Fecha:</span><span>")
                                .append(order.getCreatedAt().format(
                                                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                                .append("</span></div>");
                ticket.append("<div class='item'><span>Cajero:</span><span>")
                                .append(escapeHtml(cashier.getName())).append("</span></div>");

                if (order.getCustomerName() != null && !order.getCustomerName().isEmpty()) {
                        ticket.append("<div class='item'><span>Cliente:</span><span>")
                                        .append(escapeHtml(order.getCustomerName()))
                                        .append("</span></div>");
                }
                if (order.getChildName() != null && !order.getChildName().isEmpty()) {
                        ticket.append("<div class='item'><span>Niño(a):</span><span>")
                                        .append(escapeHtml(order.getChildName()))
                                        .append("</span></div>");
                }

                ticket.append("<div class='line'></div>");
                ticket.append("<div class='item bold'><span>Producto</span>"
                                + "<span>Importe</span></div>");
                ticket.append("<div class='line'></div>");

                for (OrderItem item : activeItems) {
                        ticket.append("<div class='item'>");
                        ticket.append("<span>")
                                        .append(escapeHtml(item.getProduct().getName()))
                                        .append("</span>");
                        ticket.append("<span>$")
                                        .append(formatDecimal(item.getSubtotal()))
                                        .append("</span>");
                        ticket.append("</div>");

                        if (item.getQuantity() > 1) {
                                ticket.append("<div class='item-detail'>")
                                                .append(item.getQuantity()).append(" x $")
                                                .append(formatDecimal(item.getUnitPrice()))
                                                .append("</div>");
                        }
                }

                ticket.append("<div class='line'></div>");

                ticket.append("<div class='item'><span>Subtotal</span><span>$")
                                .append(formatDecimal(order.getSubtotal()))
                                .append("</span></div>");

                if (order.getTax().compareTo(BigDecimal.ZERO) > 0) {
                        ticket.append("<div class='item'><span>IVA</span><span>$")
                                        .append(formatDecimal(order.getTax()))
                                        .append("</span></div>");
                }

                ticket.append("<div class='item total-line'><span>TOTAL</span><span>$")
                                .append(formatDecimal(order.getTotalAmount()))
                                .append("</span></div>");

                ticket.append("<div class='line'></div>");
                ticket.append("<div class='payment-box'>");
                ticket.append("<div class='center bold'>FORMA DE PAGO</div>");

                for (Payment p : payments) {
                        String methodLabel = switch (p.getPaymentMethod()) {
                                case CASH -> "Efectivo";
                                case CARD -> "Tarjeta";
                                case TRANSFER -> "Transferencia";
                        };

                        String methodEmoji = switch (p.getPaymentMethod()) {
                                case CASH -> "💵";
                                case CARD -> "💳";
                                case TRANSFER -> "🏦";
                        };

                        ticket.append("<div class='item'>");
                        ticket.append("<span>").append(methodEmoji).append(" ")
                                        .append(methodLabel).append("</span>");
                        ticket.append("<span>$")
                                        .append(formatDecimal(p.getAmount()))
                                        .append("</span>");
                        ticket.append("</div>");

                        if (p.getAmountReceived() != null
                                        && p.getAmountReceived().compareTo(p.getAmount()) > 0) {
                                ticket.append("<div class='item-detail'>Recibido: $")
                                                .append(formatDecimal(p.getAmountReceived()))
                                                .append("</div>");
                        }

                        if (p.getReference() != null && !p.getReference().isEmpty()) {
                                ticket.append("<div class='item-detail'>Ref: ")
                                                .append(escapeHtml(p.getReference()))
                                                .append("</div>");
                        }
                }

                ticket.append("<div class='line'></div>");

                ticket.append("<div class='item'><span>Monto recibido</span><span>$")
                                .append(formatDecimal(totalReceived))
                                .append("</span></div>");

                ticket.append("<div class='item bold'><span>Total pagado</span><span>$")
                                .append(formatDecimal(totalApplied))
                                .append("</span></div>");

                ticket.append("</div>");

                if (totalChange.compareTo(BigDecimal.ZERO) > 0) {
                        ticket.append("<div class='change-box'>");
                        ticket.append("💰 CAMBIO: $").append(formatDecimal(totalChange));
                        ticket.append("</div>");
                }

                ticket.append("<div class='line'></div>");
                ticket.append("<div class='center'>");
                ticket.append("<div>¡Gracias por tu compra!</div>");
                ticket.append("<div style='font-size:10px;'>Esperamos verte pronto</div>");

                if (!tenantWebsite.isEmpty()) {
                        ticket.append("<br><img src='https://api.qrserver.com/v1/"
                                        + "create-qr-code/?size=100x100&data=")
                                        .append(escapeHtml(tenantWebsite)).append("'/>");
                }

                ticket.append("<div style='font-size:9px; margin-top:8px; color:#999;'>")
                                .append(LocalDateTime.now().format(
                                                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                                .append("</div>");

                ticket.append("</div>");
                ticket.append("</body></html>");

                return ticket.toString();
        }

        private String formatDecimal(BigDecimal value) {
                if (value == null)
                        return "0.00";
                return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
        }

        private String escapeHtml(String text) {
                if (text == null)
                        return "";
                return text
                                .replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;")
                                .replace("\"", "&quot;");
        }
}