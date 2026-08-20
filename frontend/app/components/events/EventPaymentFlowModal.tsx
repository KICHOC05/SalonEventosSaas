import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  History,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchEventPayments,
  getEventPaymentReceipt,
  getEventTicket,
  registerEventPayment,
} from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type {
  EventPaymentMethod,
  EventPaymentResponse,
  EventResponse,
} from "~/types/event";
import {
  formatCurrency,
  formatDateTime,
  formatEventNumber,
} from "~/utils/eventHelpers";

interface EventPaymentFlowModalProps {
  event: EventResponse;
  open: boolean;
  onClose: () => void;
  onPaymentRegistered: (event: EventResponse) => void;
}

type PaymentStep = "capture" | "confirm" | "success";
type PaymentView = "charge" | "history";

const METHOD_LABELS: Record<EventPaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

const METHOD_OPTIONS: Array<{
  value: EventPaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
}> = [
  { value: "CASH", label: "Efectivo", description: "Pago recibido en caja", icon: Banknote },
  { value: "CARD", label: "Tarjeta", description: "Terminal o enlace de pago", icon: CreditCard },
  { value: "TRANSFER", label: "Transferencia", description: "SPEI o depósito bancario", icon: WalletCards },
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function writeLoadingDocument(win: Window, title: string) {
  win.document.open();
  win.document.write(`<!doctype html><html><head><title>${title}</title></head><body style="font-family:system-ui;padding:24px;text-align:center"><p>Cargando comprobante...</p></body></html>`);
  win.document.close();
}

export default function EventPaymentFlowModal({
  event,
  open,
  onClose,
  onPaymentRegistered,
}: EventPaymentFlowModalProps) {
  const { role, user } = useAuth();
  const [view, setView] = useState<PaymentView>("charge");
  const [step, setStep] = useState<PaymentStep>("capture");
  const [amountInput, setAmountInput] = useState("");
  const [method, setMethod] = useState<EventPaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [payments, setPayments] = useState<EventPaymentResponse[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [documentLoadingId, setDocumentLoadingId] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<EventPaymentResponse | null>(null);
  const [totalPaid, setTotalPaid] = useState(event.depositAmount);
  const [remainingAmount, setRemainingAmount] = useState(event.remainingAmount);
  const submissionInFlight = useRef(false);

  const amount = Number(amountInput || 0);
  const requiresReference = method === "CARD" || method === "TRANSFER";
  const canRegisterPayment = ["ADMIN", "MANAGER", "CASHIER"].includes(role);
  const eventAcceptsPayments = !["CANCELLED", "COMPLETED"].includes(event.status);
  const isLiquidated = remainingAmount <= 0;
  const paidPercent = event.eventPrice > 0
    ? Math.min(100, Math.max(0, (totalPaid / event.eventPrice) * 100))
    : 0;
  const projectedTotalPaid = roundCurrency(totalPaid + amount);
  const projectedBalance = roundCurrency(Math.max(0, remainingAmount - amount));

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError("");
    try {
      setPayments(await fetchEventPayments(event.publicId));
    } catch (error: any) {
      setPaymentsError(error?.message || "No se pudieron cargar los pagos del evento.");
    } finally {
      setPaymentsLoading(false);
    }
  }, [event.publicId]);

  useEffect(() => {
    if (!open) return;
    setView("charge");
    setStep("capture");
    setAmountInput("");
    setMethod("CASH");
    setReference("");
    setNotes("");
    setShowNotes(false);
    setFormError("");
    setDocumentError("");
    setCreatedPayment(null);
    setTotalPaid(event.depositAmount);
    setRemainingAmount(event.remainingAmount);
    submissionInFlight.current = false;
    loadPayments();
  }, [open, event.publicId, loadPayments]);

  const validationError = useMemo(() => {
    if (!canRegisterPayment) return "Tu rol permite consultar pagos, pero no registrarlos.";
    if (!eventAcceptsPayments) return `No se pueden registrar pagos en un evento ${event.status === "CANCELLED" ? "cancelado" : "completado"}.`;
    if (isLiquidated) return "El evento ya está liquidado.";
    if (!Number.isFinite(amount) || amount <= 0) return "Ingresa un monto mayor a cero.";
    if (amount > remainingAmount) return "El monto no puede superar el saldo pendiente.";
    if (requiresReference && !reference.trim()) return `Ingresa la referencia del pago con ${METHOD_LABELS[method].toLowerCase()}.`;
    return "";
  }, [amount, canRegisterPayment, event.status, eventAcceptsPayments, isLiquidated, method, reference, remainingAmount, requiresReference]);

  const continueToConfirmation = () => {
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setStep("confirm");
  };

  const registerPayment = async () => {
    if (submissionInFlight.current || validationError) {
      if (validationError) setFormError(validationError);
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setFormError("");
    setDocumentError("");
    const previousBalance = remainingAmount;

    try {
      const result = await registerEventPayment(event.publicId, {
        amount,
        paymentMethod: method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      const nextTotalPaid = result.totalPaid ?? roundCurrency(totalPaid + amount);
      const nextRemaining = result.remainingAmount ?? roundCurrency(Math.max(0, previousBalance - amount));
      const enrichedResult: EventPaymentResponse = {
        ...result,
        previousBalance: result.previousBalance ?? previousBalance,
        totalPaid: nextTotalPaid,
        remainingAmount: nextRemaining,
        fullyPaid: result.fullyPaid ?? nextRemaining <= 0,
      };

      setCreatedPayment(enrichedResult);
      setTotalPaid(nextTotalPaid);
      setRemainingAmount(nextRemaining);
      setPayments((current) => [enrichedResult, ...current.filter((payment) => payment.publicId !== enrichedResult.publicId)]);
      setStep("success");
      onPaymentRegistered({
        ...event,
        depositAmount: nextTotalPaid,
        remainingAmount: nextRemaining,
      });
      toast.success("Pago registrado correctamente");
    } catch (error: any) {
      setFormError(error?.message || "No se pudo registrar el pago. Verifica la caja y vuelve a intentarlo.");
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  const openDocument = async ({
    id,
    title,
    load,
    autoPrint,
  }: {
    id: string;
    title: string;
    load: () => Promise<string>;
    autoPrint: boolean;
  }) => {
    if (documentLoadingId) return;
    setDocumentError("");
    const win = window.open("", "_blank", "width=440,height=720");
    if (!win) {
      setDocumentError("El navegador bloqueó el comprobante. Permite las ventanas emergentes e inténtalo nuevamente.");
      return;
    }

    writeLoadingDocument(win, title);
    setDocumentLoadingId(id);
    try {
      const html = await load();
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      if (autoPrint) {
        window.setTimeout(() => win.print(), 250);
      }
    } catch (error: any) {
      win.close();
      setDocumentError(error?.message || "No se pudo generar el comprobante. Inténtalo nuevamente.");
    } finally {
      setDocumentLoadingId(null);
    }
  };

  const openReceipt = (paymentPublicId: string, autoPrint: boolean) => openDocument({
    id: paymentPublicId,
    title: "Recibo de pago",
    load: () => getEventPaymentReceipt(event.publicId, paymentPublicId),
    autoPrint,
  });

  const openAccountStatement = (autoPrint: boolean) => openDocument({
    id: "event-ticket",
    title: "Estado de cuenta del evento",
    load: () => getEventTicket(event.publicId),
    autoPrint,
  });

  const startAnotherPayment = () => {
    setStep("capture");
    setAmountInput("");
    setMethod("CASH");
    setReference("");
    setNotes("");
    setShowNotes(false);
    setFormError("");
    setDocumentError("");
    setCreatedPayment(null);
  };

  if (!open) return null;

  return (
    <dialog className="modal modal-open z-[70]" open aria-label="Pagos del evento">
      <div className="modal-box w-[calc(100%-1rem)] max-w-4xl max-h-[calc(100dvh-1rem)] p-0 overflow-hidden flex flex-col">
        <header className="shrink-0 border-b border-base-300/30 bg-base-100 px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg leading-tight">Cobro del evento</h2>
                <p className="text-xs text-base-content/50 truncate">
                  {formatEventNumber(event.eventNumber)} · {event.customerName} · {event.childName}
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Cerrar pagos">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            <div className="rounded-xl bg-base-200/70 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-base-content/45">Precio total</p>
              <p className="font-bold text-sm sm:text-base">{formatCurrency(event.eventPrice)}</p>
            </div>
            <div className="rounded-xl bg-success/10 border border-success/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-success/70">Total pagado</p>
              <p className="font-bold text-sm sm:text-base text-success">{formatCurrency(totalPaid)}</p>
            </div>
            <div className={`rounded-xl border px-3 py-2.5 ${isLiquidated ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"}`}>
              <p className={`text-[10px] uppercase tracking-wide ${isLiquidated ? "text-success/70" : "text-warning/80"}`}>Saldo pendiente</p>
              <p className={`font-extrabold text-sm sm:text-base ${isLiquidated ? "text-success" : "text-warning"}`}>{formatCurrency(remainingAmount)}</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-base-200 rounded-full overflow-hidden">
            <div className="h-full bg-success transition-all duration-500" style={{ width: `${paidPercent}%` }} />
          </div>
        </header>

        <div className="shrink-0 px-4 sm:px-6 pt-3 bg-base-100">
          <div role="tablist" className="tabs tabs-box bg-base-200/70 p-1 w-full">
            <button
              type="button"
              role="tab"
              className={`tab flex-1 gap-2 ${view === "charge" ? "tab-active" : ""}`}
              onClick={() => setView("charge")}
            >
              <WalletCards className="w-4 h-4" /> Cobrar
            </button>
            <button
              type="button"
              role="tab"
              className={`tab flex-1 gap-2 ${view === "history" ? "tab-active" : ""}`}
              onClick={() => setView("history")}
            >
              <History className="w-4 h-4" /> Historial ({payments.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 [scrollbar-width:thin]">
          {view === "history" ? (
            <section aria-label="Historial de pagos" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Pagos registrados</h3>
                  <p className="text-xs text-base-content/50">Cada recibo corresponde a un pago individual.</p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm gap-1.5" onClick={loadPayments} disabled={paymentsLoading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${paymentsLoading ? "animate-spin" : ""}`} /> Actualizar
                </button>
              </div>

              {paymentsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : paymentsError ? (
                <div className="rounded-xl border border-error/25 bg-error/10 p-4 text-sm">
                  <p className="font-semibold text-error">No pudimos cargar los pagos</p>
                  <p className="text-base-content/60 mt-1">{paymentsError}</p>
                  <button type="button" className="btn btn-error btn-outline btn-sm mt-3" onClick={loadPayments}>Reintentar</button>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-base-300">
                  <ReceiptText className="w-9 h-9 mx-auto text-base-content/25" />
                  <p className="font-semibold mt-3">Aún no hay pagos registrados</p>
                  <p className="text-sm text-base-content/50 mt-1">El primer pago aparecerá aquí con su recibo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <article key={payment.publicId} className="rounded-xl border border-base-300/40 bg-base-100 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ReceiptText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-bold">{formatCurrency(payment.amount)}</p>
                          <span className="badge badge-sm badge-ghost">{METHOD_LABELS[payment.paymentMethod as EventPaymentMethod] ?? payment.paymentMethod}</span>
                        </div>
                        <p className="text-xs text-base-content/50 mt-1">{formatDateTime(payment.paidAt)} · {payment.receivedByUserEmail || "Usuario del sistema"}</p>
                        {payment.reference && <p className="text-xs text-base-content/60 truncate">Referencia: {payment.reference}</p>}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm gap-1.5"
                        onClick={() => openReceipt(payment.publicId, false)}
                        disabled={documentLoadingId !== null}
                      >
                        {documentLoadingId === payment.publicId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        Ver recibo
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : step === "capture" ? (
            <section className="space-y-5" aria-label="Capturar pago">
              {!canRegisterPayment || !eventAcceptsPayments || isLiquidated ? (
                <div className={`rounded-2xl border p-5 text-center ${isLiquidated ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"}`}>
                  {isLiquidated ? <CheckCircle2 className="w-10 h-10 text-success mx-auto" /> : <ShieldCheck className="w-10 h-10 text-warning mx-auto" />}
                  <p className="font-bold mt-3">{isLiquidated ? "Evento liquidado" : "Cobro no disponible"}</p>
                  <p className="text-sm text-base-content/60 mt-1">{isLiquidated ? "No existe saldo pendiente para este evento." : validationError}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="event-payment-amount" className="block text-sm font-semibold mb-2">¿Cuánto recibiste?</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-base-content/45">$</span>
                      <input
                        id="event-payment-amount"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max={remainingAmount}
                        step="0.01"
                        value={amountInput}
                        onChange={(e) => { setAmountInput(e.target.value); setFormError(""); }}
                        className="input input-bordered h-14 w-full pl-9 text-xl font-extrabold"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setAmountInput(String(roundCurrency(remainingAmount / 2)))}>50% del saldo</button>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => setAmountInput(String(remainingAmount))}>Liquidar {formatCurrency(remainingAmount)}</button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Método de pago</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {METHOD_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const selected = method === option.value;
                        return (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => { setMethod(option.value); setFormError(""); }}
                            className={`rounded-xl border p-3 text-left transition-all ${selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-base-300/50 hover:border-primary/40"}`}
                            aria-pressed={selected}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-base-content/50"}`} />
                              <span className="font-semibold text-sm">{option.label}</span>
                              {selected && <Check className="w-4 h-4 text-primary ml-auto" />}
                            </div>
                            <p className="text-[11px] text-base-content/45 mt-1">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {requiresReference && (
                    <div>
                      <label htmlFor="event-payment-reference" className="block text-sm font-semibold mb-2">Referencia del pago *</label>
                      <input
                        id="event-payment-reference"
                        type="text"
                        value={reference}
                        onChange={(e) => { setReference(e.target.value); setFormError(""); }}
                        className="input input-bordered w-full"
                        placeholder={method === "TRANSFER" ? "Ej. folio SPEI" : "Ej. autorización o últimos 4 dígitos"}
                        maxLength={120}
                      />
                      <p className="text-xs text-base-content/45 mt-1">Ayuda a validar y localizar el pago posteriormente.</p>
                    </div>
                  )}

                  <div className="rounded-xl bg-base-200/70 p-3">
                    <button type="button" className="flex items-center justify-between w-full text-sm font-medium" onClick={() => setShowNotes((current) => !current)}>
                      Información adicional <ChevronDown className={`w-4 h-4 transition-transform ${showNotes ? "rotate-180" : ""}`} />
                    </button>
                    {showNotes && (
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="textarea textarea-bordered w-full mt-3"
                        rows={2}
                        maxLength={500}
                        placeholder="Notas internas sobre este pago"
                      />
                    )}
                  </div>

                  {amount > 0 && amount <= remainingAmount && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm space-y-1.5">
                      <div className="flex justify-between"><span className="text-base-content/60">Total después del pago</span><strong>{formatCurrency(projectedTotalPaid)}</strong></div>
                      <div className="flex justify-between"><span className="text-base-content/60">Nuevo saldo pendiente</span><strong className={projectedBalance <= 0 ? "text-success" : "text-warning"}>{formatCurrency(projectedBalance)}</strong></div>
                    </div>
                  )}
                </>
              )}

              {formError && <div role="alert" className="alert alert-error text-sm py-3"><span>{formError}</span></div>}
            </section>
          ) : step === "confirm" ? (
            <section className="space-y-5" aria-label="Confirmar pago">
              <button type="button" className="btn btn-ghost btn-sm gap-1 -ml-2" onClick={() => setStep("capture")} disabled={submitting}>
                <ArrowLeft className="w-4 h-4" /> Corregir datos
              </button>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto"><ShieldCheck className="w-7 h-7" /></div>
                <h3 className="font-extrabold text-xl mt-3">Confirma el pago</h3>
                <p className="text-sm text-base-content/55 mt-1">Revisa la información antes de registrarla en caja.</p>
              </div>
              <div className="rounded-2xl border border-base-300/50 divide-y divide-base-300/30 overflow-hidden">
                <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Evento</span><strong className="text-right">{formatEventNumber(event.eventNumber)}</strong></div>
                <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Cliente</span><strong className="text-right">{event.customerName}</strong></div>
                <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Monto</span><strong className="text-primary text-lg">{formatCurrency(amount)}</strong></div>
                <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Método</span><strong>{METHOD_LABELS[method]}</strong></div>
                {reference.trim() && <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Referencia</span><strong className="text-right break-all">{reference.trim()}</strong></div>}
                <div className="flex justify-between gap-4 p-3.5"><span className="text-base-content/55">Saldo anterior</span><strong>{formatCurrency(remainingAmount)}</strong></div>
                <div className="flex justify-between gap-4 p-3.5 bg-success/5"><span className="text-base-content/55">Saldo después del pago</span><strong className={projectedBalance <= 0 ? "text-success" : "text-warning"}>{formatCurrency(projectedBalance)}</strong></div>
              </div>
              <div className="rounded-xl bg-info/10 border border-info/20 p-3 text-xs text-base-content/65 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <span>El pago se registrará en la caja abierta de <strong>{user?.branchName || "la sucursal actual"}</strong> y se reflejará en reportes y estadísticas.</span>
              </div>
              {formError && <div role="alert" className="alert alert-error text-sm py-3"><span>{formError}</span></div>}
            </section>
          ) : (
            <section className="space-y-5" aria-label="Pago registrado">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9" /></div>
                <h3 className="font-extrabold text-2xl mt-4">Pago registrado</h3>
                <p className="text-sm text-base-content/55 mt-1">El movimiento quedó guardado correctamente.</p>
              </div>
              <div className="rounded-2xl border border-success/25 bg-success/5 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-success/15">
                  <div><p className="text-xs text-base-content/50">Pago recibido</p><p className="font-extrabold text-2xl text-success">{formatCurrency(createdPayment?.amount ?? amount)}</p></div>
                  <span className="badge badge-success badge-outline">{METHOD_LABELS[(createdPayment?.paymentMethod ?? method) as EventPaymentMethod] ?? createdPayment?.paymentMethod}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 text-sm">
                  <div><p className="text-xs text-base-content/45">Total pagado</p><p className="font-bold">{formatCurrency(totalPaid)}</p></div>
                  <div className="text-right"><p className="text-xs text-base-content/45">Saldo restante</p><p className={`font-bold ${isLiquidated ? "text-success" : "text-warning"}`}>{formatCurrency(remainingAmount)}</p></div>
                </div>
                {isLiquidated && <div className="mt-4 rounded-xl bg-success/15 text-success text-center font-extrabold py-2">EVENTO LIQUIDADO</div>}
              </div>

              {documentError && <div role="alert" className="alert alert-warning text-sm py-3"><span>{documentError}</span></div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn btn-primary gap-2"
                  onClick={() => createdPayment && openReceipt(createdPayment.publicId, true)}
                  disabled={!createdPayment || documentLoadingId !== null}
                >
                  {documentLoadingId === createdPayment?.publicId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Imprimir recibo
                </button>
                <button
                  type="button"
                  className="btn btn-outline gap-2"
                  onClick={() => createdPayment && openReceipt(createdPayment.publicId, false)}
                  disabled={!createdPayment || documentLoadingId !== null}
                >
                  <Eye className="w-4 h-4" /> Ver recibo
                </button>
                <button type="button" className="btn btn-ghost gap-2" onClick={() => openAccountStatement(false)} disabled={documentLoadingId !== null}>
                  {documentLoadingId === "event-ticket" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ReceiptText className="w-4 h-4" />}
                  Estado de cuenta completo
                </button>
                {!isLiquidated ? (
                  <button type="button" className="btn btn-ghost gap-2" onClick={startAnotherPayment}><WalletCards className="w-4 h-4" /> Registrar otro pago</button>
                ) : (
                  <button type="button" className="btn btn-success btn-outline" onClick={onClose}>Finalizar</button>
                )}
              </div>
            </section>
          )}
        </div>

        {view === "charge" && step !== "success" && canRegisterPayment && eventAcceptsPayments && !isLiquidated && (
          <footer className="shrink-0 border-t border-base-300/30 bg-base-100 px-4 sm:px-6 py-3 flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={step === "confirm" ? () => setStep("capture") : onClose} disabled={submitting}>
              {step === "confirm" ? "Volver" : "Cancelar"}
            </button>
            <button type="button" className="btn btn-primary flex-[1.5] gap-2" onClick={step === "confirm" ? registerPayment : continueToConfirmation} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : step === "confirm" ? <><ShieldCheck className="w-4 h-4" /> Confirmar pago de {formatCurrency(amount)}</> : <>Revisar pago <Check className="w-4 h-4" /></>}
            </button>
          </footer>
        )}
      </div>
      <form method="dialog" className="modal-backdrop"><button type="button" onClick={onClose}>Cerrar</button></form>
    </dialog>
  );
}
