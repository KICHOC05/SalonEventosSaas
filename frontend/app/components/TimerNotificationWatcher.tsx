import { useEffect, useRef } from "react";
import { fetchActiveSessions, type ActiveSessionResponse } from "~/lib/api";
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

export default function TimerNotificationWatcher() {
  const { addNotification } = useNotifications();
  const previousTimersRef = useRef<Map<string, ActiveSessionResponse>>(new Map());
  const fiveMinRef = useRef<Set<string>>(new Set());
  const oneMinRef = useRef<Set<string>>(new Set());
  const finishedRef = useRef<Set<string>>(new Set());

  // Cargar datos persistentes desde localStorage al montar
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

  const checkTimers = async () => {
    try {
      const timers = await fetchActiveSessions();
      const currentIds = new Set(timers.map(t => t.itemPublicId));

      // Detectar timers que desaparecieron (finalizaron)
      previousTimersRef.current.forEach((oldTimer, timerId) => {
        const stillExists = currentIds.has(timerId);
        
        if (!stillExists) {
          if (!finishedRef.current.has(timerId)) {
            finishedRef.current.add(timerId);
            saveSet(STORAGE_KEYS.FINISHED, finishedRef.current);
            
            // Limpiar de otros sets si existen
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
              message: `${oldTimer.childName} ha finalizado`,
              type: "success",
            });
            toast.success(`✅ ${oldTimer.childName} finalizó`);
            playSound("/sounds/finished.mp3");
          }
        }
      });

      // Procesar timers actuales para alertas de tiempo
      timers.forEach((timer) => {
        const { itemPublicId, childName, remainingSeconds } = timer;

        // Menos de 5 minutos (entre 1 minuto y 5 minutos)
        if (remainingSeconds <= 300 && remainingSeconds > 60) {
          if (!fiveMinRef.current.has(itemPublicId)) {
            fiveMinRef.current.add(itemPublicId);
            saveSet(STORAGE_KEYS.FIVE_MIN, fiveMinRef.current);
            
            addNotification({
              title: "Timer próximo a finalizar",
              message: `${childName} termina en menos de 5 minutos`,
              type: "warning",
            });
            toast("⚠️ Timer próximo a finalizar");
            playSound("/sounds/warning.mp3");
          }
        }

        // Menos de 1 minuto (entre 1 segundo y 1 minuto)
        if (remainingSeconds <= 60 && remainingSeconds > 0) {
          if (!oneMinRef.current.has(itemPublicId)) {
            oneMinRef.current.add(itemPublicId);
            saveSet(STORAGE_KEYS.ONE_MIN, oneMinRef.current);
            
            addNotification({
              title: "Último minuto",
              message: `${childName} termina en menos de 1 minuto`,
              type: "warning",
            });
            toast("⏳ Último minuto");
            playSound("/sounds/warning.mp3");
          }
        }
      });

      // Actualizar snapshot de timers activos
      previousTimersRef.current = new Map(
        timers.map(timer => [timer.itemPublicId, timer])
      );
      
    } catch (error) {
      console.error("Error checking timers:", error);
    }
  };

  useEffect(() => {
    // Ejecutar inmediatamente al montar
    checkTimers();

    // Configurar intervalo cada 10 segundos
    const interval = setInterval(checkTimers, 10000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  return null;
}