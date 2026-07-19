import { useEffect, useRef, useMemo } from "react";
import { Client } from "@stomp/stompjs";
import { useAuth } from "~/lib/auth";
import { useNotifications } from "~/context/NotificationContext";
import toast from "react-hot-toast";

const STORAGE_KEYS = {
  FIVE_MIN: "timer_notifications_5min",
  ONE_MIN: "timer_notifications_1min",
  FINISHED: "timer_notifications_finished",
};

const playSound = (url: string) => {
  if (typeof window !== "undefined") {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error("Error playing sound:", error);
    });
  }
};

const saveSet = (key: string, set: Set<string>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }
};

interface TimerNotificationEvent {
  type: "FIVE_MIN" | "ONE_MIN" | "FINISHED";
  timerId: string;
  childName: string;
  message: string;
  remainingSeconds: number;
  timestamp: string;
}

export default function TimerNotificationWatcher() {
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);

  const fiveMinRef = useRef<Set<string>>(new Set());
  const oneMinRef = useRef<Set<string>>(new Set());
  const finishedRef = useRef<Set<string>>(new Set());

  const tenantId = user?.tenantId;
  const token = user?.token;
  const topic = useMemo(() => {
    if (!tenantId) return null;
    return `/topic/tenant/${tenantId}/timers`;
  }, [tenantId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fiveMin = localStorage.getItem(STORAGE_KEYS.FIVE_MIN);
      const oneMin = localStorage.getItem(STORAGE_KEYS.ONE_MIN);
      const finished = localStorage.getItem(STORAGE_KEYS.FINISHED);

      if (fiveMin) {
        fiveMinRef.current = new Set(JSON.parse(fiveMin));
      }
      if (oneMin) {
        oneMinRef.current = new Set(JSON.parse(oneMin));
      }
      if (finished) {
        finishedRef.current = new Set(JSON.parse(finished));
      }
    }
  }, []);

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
        console.log("[WS]", msg);
      },
      onConnect: () => {
        console.log("[WS] Connected, subscribing to", topic);

        client.subscribe(topic, (message) => {
          try {
            const event: TimerNotificationEvent = JSON.parse(message.body);
            console.log("[WS] Event", event);

            const { type, timerId, childName, message: eventMessage } = event;

            switch (type) {
              case "FIVE_MIN":
                if (!fiveMinRef.current.has(timerId)) {
                  fiveMinRef.current.add(timerId);
                  saveSet(STORAGE_KEYS.FIVE_MIN, fiveMinRef.current);

                  addNotification({
                    title: "Timer próximo a finalizar",
                    message: eventMessage,
                    type: "warning",
                  });
                  toast("⚠️ Timer próximo a finalizar");
                  playSound("/sounds/warning.mp3");
                }
                break;

              case "ONE_MIN":
                if (!oneMinRef.current.has(timerId)) {
                  oneMinRef.current.add(timerId);
                  saveSet(STORAGE_KEYS.ONE_MIN, oneMinRef.current);

                  addNotification({
                    title: "Último minuto",
                    message: eventMessage,
                    type: "warning",
                  });
                  toast("⏳ Último minuto");
                  playSound("/sounds/warning.mp3");
                }
                break;

              case "FINISHED":
                if (!finishedRef.current.has(timerId)) {
                  finishedRef.current.add(timerId);
                  saveSet(STORAGE_KEYS.FINISHED, finishedRef.current);

                  if (fiveMinRef.current.has(timerId)) {
                    fiveMinRef.current.delete(timerId);
                    saveSet(STORAGE_KEYS.FIVE_MIN, fiveMinRef.current);
                  }
                  if (oneMinRef.current.has(timerId)) {
                    oneMinRef.current.delete(timerId);
                    saveSet(STORAGE_KEYS.ONE_MIN, oneMinRef.current);
                  }

                  addNotification({
                    title: "Sesión finalizada",
                    message: eventMessage,
                    type: "success",
                  });
                  toast.success(`✅ ${childName} finalizó`);
                  playSound("/sounds/finished.mp3");
                }
                break;
            }
          } catch (error) {
            console.error("[WS] Error parsing message:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[WS] STOMP error:", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.log("[WS] Disconnecting...");
        clientRef.current.deactivate();
      }
    };
  }, [addNotification, isAuthenticated, token, topic]);

  return null;
}