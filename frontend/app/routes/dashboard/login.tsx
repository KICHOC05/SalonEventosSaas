import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { Rocket, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Inicio de Sesion", "Acceso al panel de administracion");
}

export default function DashboardLogin() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const tenantPublicId = import.meta.env.VITE_TENANT_PUBLIC_ID ?? "";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            if (err.status === 401 || err.status === 403) {
                setError("Correo o contraseña incorrectos");
            } else if (err.status === 500) {
                setError("Error interno del servidor. Intenta más tarde.");
            } else {
                setError(err.message || "Error al iniciar sesión");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl transition-all" />
                <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/10 rounded-full blur-3xl transition-all" />
            </div>

            <div className="w-full max-w-[22rem] sm:max-w-md relative z-10">

                <div className="text-center mb-6 sm:mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-full mb-3 sm:mb-4 shadow-lg shadow-primary/25">
                        <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-primary-content" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">Space Kids</h1>
                    <p className="text-sm sm:text-base text-base-content/50 mt-1">Panel de Administración</p>
                </div>

                <div
                    className="card bg-base-100 shadow-2xl animate-slide-up"
                    style={{ animationDelay: "100ms" }}
                >
                    <div className="card-body p-6 sm:p-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-center mb-1 sm:mb-2">
                            Iniciar Sesión
                        </h2>
                        <p className="text-xs sm:text-sm text-base-content/50 text-center mb-6">
                            Ingresa tus credenciales para acceder
                        </p>

                        {error && (
                            <div className="alert alert-error mb-4 text-sm">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div className="form-control w-full">
                                <label className="label pt-0">
                                    <span className="label-text font-medium text-sm sm:text-base">
                                        Correo electrónico
                                    </span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="admin@spacekids.com"
                                    className="input input-bordered w-full text-sm sm:text-base"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>

                            <div className="form-control w-full">
                                <label className="label pt-0">
                                    <span className="label-text font-medium text-sm sm:text-base">
                                        Contraseña
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="input input-bordered w-full pr-12 text-sm sm:text-base"
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
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                                        ) : (
                                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                                <label className="label cursor-pointer p-0 gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-xs sm:checkbox-sm"
                                    />
                                    <span className="label-text text-xs sm:text-sm">Recordarme</span>
                                </label>
                                <a
                                    href="#"
                                    className="text-xs sm:text-sm text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full gap-2 mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                            </button>
                        </form>

                        <div className="divider text-[10px] sm:text-xs text-base-content/30 my-4 sm:my-6">
                            ACCESO RESTRINGIDO
                        </div>

                        <div className="bg-base-200/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm border border-base-200">
                            <p className="text-base-content/60 text-center leading-relaxed">
                                🔒 Solo personal autorizado. Contacta al administrador
                                si necesitas acceso.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="text-center mt-6 sm:mt-8 animate-slide-up"
                    style={{ animationDelay: "200ms" }}
                >
                    <Link
                        to="/"
                        className="text-xs sm:text-sm font-medium text-base-content/50 hover:text-primary transition-colors"
                    >
                        ← Volver al sitio principal
                    </Link>
                </div>
            </div>
        </div>
    );
}