package com.example.demo.ticket.service;

import com.example.demo.branch.model.Branch;
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

                // Datos dinámicos desde la orden
                Tenant tenant = order.getTenant();
                Branch branch = order.getBranch();
                User cashier = order.getUser();

                List<OrderItem> items = orderItemRepository.findAllByOrder_Id(order.getId());
                List<Payment> payments = paymentRepository.findAllByOrder_Id(order.getId());

                BigDecimal totalPaid = payments.stream()
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal change = totalPaid.subtract(order.getTotalAmount());

                // ─── Datos de la empresa ───
                String businessName = tenant.getBusinessName() != null
                                ? tenant.getBusinessName()
                                : "Mi Empresa";

                String logoUrl = tenant.getLogoUrl() != null
                                ? tenant.getLogoUrl()
                                : "";

                String tenantPhone = tenant.getPhone() != null
                                ? tenant.getPhone()
                                : "";

                String tenantWebsite = tenant.getWebsite() != null
                                ? tenant.getWebsite()
                                : "";

                // ─── Datos de la sucursal ───
                String branchName = branch.getName() != null
                                ? branch.getName()
                                : "";

                String branchAddress = branch.getAddress() != null
                                ? branch.getAddress()
                                : "";

                String branchPhone = branch.getPhone() != null
                                ? branch.getPhone()
                                : "";

                // ─── Construir HTML ───
                StringBuilder ticket = new StringBuilder();

                ticket.append("""
                                <html>
                                <head>
                                <style>
                                body{
                                    font-family: monospace;
                                    width:300px;
                                    margin: 0 auto;
                                }
                                .center{text-align:center;}
                                .line{border-top:1px dashed black;margin:5px 0;}
                                .item{display:flex;justify-content:space-between;}
                                img.logo{width:120px;margin:auto;display:block;}
                                </style>
                                </head>
                                <body>
                                """);

                // ─── Encabezado ───
                ticket.append("<div class='center'>");

                if (!logoUrl.isEmpty()) {
                        ticket.append("<img class='logo' src='").append(logoUrl).append("'/>");
                }

                ticket.append("<h3>").append(escapeHtml(businessName)).append("</h3>");

                if (!branchName.isEmpty()) {
                        ticket.append("Sucursal: ").append(escapeHtml(branchName)).append("<br>");
                }
                if (!branchAddress.isEmpty()) {
                        ticket.append(escapeHtml(branchAddress)).append("<br>");
                }
                if (!branchPhone.isEmpty()) {
                        ticket.append("Tel: ").append(escapeHtml(branchPhone)).append("<br>");
                } else if (!tenantPhone.isEmpty()) {
                        ticket.append("Tel: ").append(escapeHtml(tenantPhone)).append("<br>");
                }
                if (!tenantWebsite.isEmpty()) {
                        ticket.append(escapeHtml(tenantWebsite)).append("<br>");
                }

                ticket.append("</div>");

                // ─── Info de orden ───
                ticket.append("<div class='line'></div>");

                ticket.append("Orden: ").append(order.getPublicId()).append("<br>");
                ticket.append("Fecha: ")
                                .append(order.getCreatedAt()
                                                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                                .append("<br>");
                ticket.append("Cajero: ").append(escapeHtml(cashier.getName())).append("<br>");

                if (order.getCustomerName() != null) {
                        ticket.append("Cliente: ").append(escapeHtml(order.getCustomerName())).append("<br>");
                }
                if (order.getChildName() != null) {
                        ticket.append("Niño(a): ").append(escapeHtml(order.getChildName())).append("<br>");
                }

                // ─── Items ───
                ticket.append("<div class='line'></div>");

                for (OrderItem item : items) {
                        ticket.append(escapeHtml(item.getProduct().getName())).append("<br>");
                        ticket.append("<div class='item'>")
                                        .append(item.getQuantity())
                                        .append(" x $").append(item.getUnitPrice())
                                        .append("<span>$").append(item.getSubtotal())
                                        .append("</span></div>");
                }

                // ─── Totales ───
                ticket.append("<div class='line'></div>");

                ticket.append("<div class='item'>Subtotal<span>$")
                                .append(order.getSubtotal()).append("</span></div>");

                if (order.getTax().compareTo(BigDecimal.ZERO) > 0) {
                        ticket.append("<div class='item'>IVA<span>$")
                                        .append(order.getTax()).append("</span></div>");
                }

                ticket.append("<div class='item'><b>TOTAL</b><span><b>$")
                                .append(order.getTotalAmount()).append("</b></span></div>");

                // ─── Pagos ───
                ticket.append("<div class='line'></div>");

                ticket.append("<div class='item'>Pago<span>$")
                                .append(totalPaid).append("</span></div>");

                if (change.compareTo(BigDecimal.ZERO) > 0) {
                        ticket.append("<div class='item'>Cambio<span>$")
                                        .append(change).append("</span></div>");
                }

                // ─── Pie ───
                ticket.append("<div class='line'></div>");

                ticket.append("<div class='center'>");
                ticket.append("¡Gracias por tu compra!<br>");
                ticket.append("Esperamos verte pronto<br><br>");

                if (!tenantWebsite.isEmpty()) {
                        ticket.append("<img src='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=")
                                        .append(tenantWebsite).append("'/>");
                }

                ticket.append("</div>");
                ticket.append("</body></html>");

                return ticket.toString();
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