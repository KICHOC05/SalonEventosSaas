import {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: "success" | "warning" | "info";
    read: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: AppNotification[];

    addNotification: (
        notification: Omit<
            AppNotification,
            "id" | "read" | "createdAt"
        >
    ) => void;

    markAllAsRead: () => void;

    removeNotification: (id: string) => void;

    clearNotifications: () => void;
}

const NotificationContext =
    createContext<NotificationContextType | null>(
        null
    );

export function NotificationProvider({
    children
}: {
    children: React.ReactNode;
}) {

    const [notifications, setNotifications] =
        useState<AppNotification[]>([]);
    
    const [isClient, setIsClient] = useState(false);

    // Marcar cuando estamos en el cliente
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Cargar desde localStorage solo en el cliente
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("spacekids_notifications");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setNotifications(parsed);
                } catch (error) {
                    console.error("Error parsing notifications from localStorage:", error);
                }
            }
        }
    }, []);

    // Guardar en localStorage solo cuando cambian las notificaciones y estamos en el cliente
    useEffect(() => {
        if (typeof window !== "undefined" && isClient) {
            localStorage.setItem(
                "spacekids_notifications",
                JSON.stringify(notifications)
            );
        }
    }, [notifications, isClient]);

    const addNotification = (
        notification: Omit<
            AppNotification,
            "id" | "read" | "createdAt"
        >
    ) => {

        setNotifications(prev => [
            {
                ...notification,
                id: crypto.randomUUID(),
                read: false,
                createdAt:
                    new Date().toISOString()
            },
            ...prev
        ]);
    };

    const markAllAsRead = () => {

        setNotifications(prev =>
            prev.map(item => ({
                ...item,
                read: true
            }))
        );
    };

    const removeNotification = (id: string) => {
        setNotifications(prev =>
            prev.filter(item => item.id !== id)
        );
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                markAllAsRead,
                removeNotification,
                clearNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {

    const context =
        useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "NotificationProvider missing"
        );
    }

    return context;
}