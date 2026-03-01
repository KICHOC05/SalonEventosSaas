// app/routes/dashboard/login.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { Rocket, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "~/lib/auth";

export default function DashboardLogin() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const tenantPublicId = import.meta.env.VITE_TENANT_PUBLIC_ID ?? "";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Si ya está autenticado, redirigir
    if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
        return null;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!tenantPublicId) {
            setError("Tenant no configurado en el frontend (VITE_TENANT_PUBLIC_ID)");
            setLoading(false);
            return;
        }

        try {
            await login({ tenantPublicId, email, password });
            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg shadow-primary/25">
                        <Rocket className="w-8 h-8 text-primary-content" />
                    </div>
                    <h1 className="text-3xl font-bold text-primary">Space Kids</h1>
                    <p className="text-base-content/50 mt-1">Panel de Administración</p>
                </div>

                {/* Card de Login */}
                <div
                    className="card bg-base-100 shadow-xl animate-slide-up"
                    style={{ animationDelay: "100ms" }}
                >
                    <div className="card-body p-8">
                        <h2 className="text-xl font-semibold text-center mb-2">
                            Iniciar Sesión
                        </h2>
                        <p className="text-sm text-base-content/50 text-center mb-6">
                            Ingresa tus credenciales para acceder
                        </p>

                        {/* Error Alert */}
                        {error && (
                            <div className="alert alert-error mb-4">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text font-medium">
                                        Correo electrónico
                                    </span>
                                </div>
                                <input
                                    type="email"
                                    placeholder="admin@spacekids.com"
                                    className="input input-bordered w-full"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                />
                            </label>

                            {/* Password */}
                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text font-medium">Contraseña</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="input input-bordered w-full pr-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </label>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="label cursor-pointer gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                    />
                                    <span className="label-text text-sm">Recordarme</span>
                                </label>
                                <a
                                    href="#"
                                    className="text-sm text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn btn-primary w-full gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="divider text-xs text-base-content/30 my-4">
                            ACCESO RESTRINGIDO
                        </div>

                        {/* Info */}
                        <div className="bg-base-200 rounded-lg p-4 text-sm">
                            <p className="text-base-content/60 text-center">
                                🔒 Solo personal autorizado. Contacta al administrador
                                si necesitas acceso.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Link a sitio público */}
                <div
                    className="text-center mt-6 animate-slide-up"
                    style={{ animationDelay: "200ms" }}
                >
                    <Link
                        to="/"
                        className="text-sm text-base-content/50 hover:text-primary transition-colors"
                    >
                        ← Volver al sitio principal
                    </Link>
                </div>
            </div>
        </div>
    );
}