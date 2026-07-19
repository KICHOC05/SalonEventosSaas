import { useEffect, useRef, useMemo } from "react";
import { Client } from "@stomp/stompjs";
import { useAuth } from "~/lib/auth";
import { useNotifications } from "~/context/NotificationContext";
import toast from "react-hot-toast";

const STORAGE_KEY = "event_notifications_sent";

interface EventNotificationMessage {
  type: "EVENT_5_DAYS_AWAY" | "EVENT_1_DAY_AWAY" | "EVENT_PAYMENT_PENDING";
  eventPublicId: string;
  customerName: string;
  childName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
  eventPrice: number;
  depositAmount: number;
  remainingAmount: number;
  message: string;
  createdAt: string;
}

interface EventNotificationConfig {
  type: string;
  icon: string;
  toastMsg: string;
  title: string;
  style: "warning" | "info" | "success";
}

const NOTIFICATION_CONFIG: Record<string, EventNotificationConfig> = {
  EVENT_5_DAYS_AWAY: {
    type: "EVENT_5_DAYS_AWAY",
    icon: "📅",
    toastMsg: "Evento próximo",
    title: "Evento próximo",
    style: "info",
  },
  EVENT_1_DAY_AWAY: {
    type: "EVENT_1_DAY_AWAY",
    icon: "⏰",
    toastMsg: "Recordatorio",
    title: "Recordatorio",
    style: "warning",
  },
  EVENT_PAYMENT_PENDING: {
    type: "EVENT_PAYMENT_PENDING",
    icon: "💰",
    toastMsg: "Pago pendiente",
    title: "Pago pendiente",
    style: "warning",
  },
};

const loadDedupSet = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

const saveDedupSet = (set: Set<string>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  }
};

export default function EventNotificationWatcher() {
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const dedupRef = useRef<Set<string>>(loadDedupSet());

  const tenantId = user?.tenantId;
  const token = user?.token;
  const topic = useMemo(() => {
    if (!tenantId) return null;
    return `/topic/tenant/${tenantId}/events`;
  }, [tenantId]);

  useEffect(() => {
    if (!isAuthenticated || !token || !topic) return;

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        console.log("[WS-Events]", msg);
      },
      onConnect: () => {
        console.log("[WS-Events] Connected, subscribing to", topic);

        client.subscribe(topic, (message) => {
          try {
            const event: EventNotificationMessage = JSON.parse(message.body);
            console.log("[WS-Events] Event", event);

            const config = NOTIFICATION_CONFIG[event.type];
            if (!config) return;

            const dedupKey = `${event.type}:${event.eventPublicId}`;
            if (dedupRef.current.has(dedupKey)) return;

            dedupRef.current.add(dedupKey);
            saveDedupSet(dedupRef.current);

            addNotification({
              title: config.title,
              message: event.message,
              type: config.style,
            });

            toast(`${config.icon} ${event.message}`, {
              duration: 5000,
            });
          } catch (error) {
            console.error("[WS-Events] Error parsing message:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[WS-Events] STOMP error:", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.log("[WS-Events] Disconnecting...");
        clientRef.current.deactivate();
      }
    };
  }, [addNotification, isAuthenticated, token, topic]);

  return null;
}
