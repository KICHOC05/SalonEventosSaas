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
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
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