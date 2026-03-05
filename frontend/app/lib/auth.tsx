// app/lib/auth.tsx
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import {
    type AuthUser,
    type LoginRequest,
    login as apiLogin,
    getStoredAuth,
    setStoredAuth,
    clearStoredAuth,
} from "./api";

interface AuthContextType {
    user: AuthUser | null;
    role: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    // Helpers de roles
    isAdmin: boolean;
    isManager: boolean;
    isCashier: boolean;
    isEmployee: boolean;
    canManageProducts: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar sesión almacenada al montar
    useEffect(() => {
        const stored = getStoredAuth();
        if (stored) {
            setUser(stored);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await apiLogin(data);
        const authUser: AuthUser = {
            token: response.token,
            name: response.name,
            email: response.email,
            role: response.role,
            userPublicId: response.userPublicId,
            tenantId: response.tenantId,
            branchId: response.branchId,
            businessName: response.businessName,
            branchName: response.branchName,
        };
        setStoredAuth(authUser);
        setUser(authUser);
    }, []);

    const logout = useCallback(() => {
        clearStoredAuth();
        setUser(null);
    }, []);

    const role = user?.role || "";

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                // Helpers de roles
                isAdmin: role === "ADMIN",
                isManager: role === "MANAGER",
                isCashier: role === "CASHIER",
                isEmployee: role === "EMPLOYEE",
                canManageProducts: role === "ADMIN" || role === "MANAGER",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    }
    return context;
}
