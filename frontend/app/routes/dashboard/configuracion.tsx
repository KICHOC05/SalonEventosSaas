// app/routes/configuracion.tsx
import { Settings } from "lucide-react";

export default function Configuracion() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configuración</h2>
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body items-center text-center py-16">
                    <Settings className="w-16 h-16 text-base-content/20 animate-spin" style={{ animationDuration: "3s" }} />
                    <h3 className="text-lg font-semibold mt-4">En desarrollo</h3>
                    <p className="text-base-content/50">
                        Próximamente podrás configurar los ajustes del sistema.
                    </p>
                    <span className="loading loading-dots loading-md text-primary mt-4" />
                </div>
            </div>
        </div>
    );
}