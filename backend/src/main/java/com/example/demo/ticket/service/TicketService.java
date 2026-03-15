package com.example.demo.ticket.service;

import com.example.demo.order.model.Order;
import com.example.demo.order.model.OrderItem;
import com.example.demo.order.repository.OrderItemRepository;
import com.example.demo.order.repository.OrderRepository;
import com.example.demo.payment.model.Payment;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.security.TenantContext;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    public String generateTicket(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Order order = orderRepository
                .findByPublicIdAndTenant_Id(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        List<OrderItem> items = orderItemRepository.findAllByOrder_Id(order.getId());

        List<Payment> payments = paymentRepository.findAllByOrder_Id(order.getId());

        BigDecimal totalPaid = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal change = totalPaid.subtract(order.getTotalAmount());

        StringBuilder ticket = new StringBuilder();

        ticket.append("""
                <html>
                <head>
                <style>
                body{
                    font-family: monospace;
                    width:300px;
                }

                .center{text-align:center;}
                .line{border-top:1px dashed black;margin:5px 0;}
                .item{display:flex;justify-content:space-between;}

                img{width:120px;margin:auto;display:block;}

                </style>
                </head>
                <body>
                """);

        ticket.append("<div class='center'>");
        ticket.append("<img src='https://spacekids.mx/logo.png'/>");
        ticket.append("<h3>SPACEKIDS</h3>");
        ticket.append("Centro de entretenimiento<br>");
        ticket.append("Calle Ignacio Zaragoza<br>");
        ticket.append("Centro, 42970 Atitalaquia<br>");
        ticket.append("Tel: 773 183 4329");
        ticket.append("</div>");

        ticket.append("<div class='line'></div>");

        ticket.append("Orden: ").append(order.getPublicId()).append("<br>");
        ticket.append("Fecha: ")
                .append(order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                .append("<br>");

        ticket.append("Cajero: ")
                .append(order.getUser().getName())
                .append("<br>");

        if (order.getCustomerName() != null)
            ticket.append("Cliente: ").append(order.getCustomerName()).append("<br>");

        if (order.getChildName() != null)
            ticket.append("Niño(a): ").append(order.getChildName()).append("<br>");

        ticket.append("<div class='line'></div>");

        for (OrderItem item : items) {

            ticket.append(item.getProduct().getName()).append("<br>");

            ticket.append("<div class='item'>")
                    .append(item.getQuantity())
                    .append(" x $")
                    .append(item.getUnitPrice())
                    .append("<span>$")
                    .append(item.getSubtotal())
                    .append("</span></div>");
        }

        ticket.append("<div class='line'></div>");

        ticket.append("<div class='item'>Subtotal<span>$")
                .append(order.getSubtotal())
                .append("</span></div>");

        ticket.append("<div class='item'>IVA<span>$")
                .append(order.getTax())
                .append("</span></div>");

        ticket.append("<div class='item'><b>TOTAL</b><span><b>$")
                .append(order.getTotalAmount())
                .append("</b></span></div>");

        ticket.append("<div class='line'></div>");

        ticket.append("<div class='item'>Pago<span>$")
                .append(totalPaid)
                .append("</span></div>");

        ticket.append("<div class='item'>Cambio<span>$")
                .append(change)
                .append("</span></div>");

        ticket.append("<div class='line'></div>");

        ticket.append("<div class='center'>");
        ticket.append("¡Gracias por tu compra!<br>");
        ticket.append("Esperamos verte pronto<br><br>");

        ticket.append("""
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://spacekids.mx"/>
        """);

        ticket.append("</div>");

        ticket.append("</body></html>");

        return ticket.toString();
    }
}