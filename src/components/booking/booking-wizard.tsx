"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  Loader2,
  MessageCircle,
  Scissors,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useActionState } from "react";

import {
  createBooking,
  fetchBookedSlots,
  type BookingFormState,
} from "@/actions/booking";
import { bookingSlotIntervalMin } from "@/lib/site-config";
import type { BusinessHour, Professional, Service } from "@/lib/types";
import { addDaysISO, cn, formatCurrency, formatDuration, todayISO } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Serviço", icon: Scissors },
  { id: 2, label: "Profissional", icon: User },
  { id: 3, label: "Data e hora", icon: CalendarDays },
  { id: 4, label: "Seus dados", icon: Check },
];

const initialState: BookingFormState = { status: "idle", message: "" };

type Props = {
  services: Service[];
  professionals: Professional[];
  hours: BusinessHour[];
  initialServiceSlug?: string;
  initialProfessionalSlug?: string;
};

export function BookingWizard({
  services,
  professionals,
  hours,
  initialServiceSlug,
  initialProfessionalSlug,
}: Props) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string>(
    () => services.find((s) => s.slug === initialServiceSlug)?.id ?? "",
  );
  const [professionalId, setProfessionalId] = useState<string>(
    () => professionals.find((p) => p.slug === initialProfessionalSlug)?.id ?? "",
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotState, setSlotState] = useState<{ key: string; slots: string[] }>({
    key: "",
    slots: [],
  });
  const [loadingSlots, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );

  const service = services.find((s) => s.id === serviceId) ?? null;
  const professional = professionals.find((p) => p.id === professionalId) ?? null;

  const dates = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 21 }, (_, index) => addDaysISO(start, index));
  }, []);

  const dayHours = useMemo(() => {
    if (!date) return null;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return hours.find((hour) => hour.weekday === weekday) ?? null;
  }, [date, hours]);

  const slots = useMemo(() => {
    if (!dayHours || dayHours.closed || !dayHours.opensAt || !dayHours.closesAt) return [];
    const duration = service?.durationMin ?? 30;
    const [openH, openM] = dayHours.opensAt.split(":").map(Number);
    const [closeH, closeM] = dayHours.closesAt.split(":").map(Number);
    const open = openH * 60 + openM;
    const close = closeH * 60 + closeM;

    const result: string[] = [];
    for (let minutes = open; minutes + duration <= close; minutes += bookingSlotIntervalMin) {
      const h = String(Math.floor(minutes / 60)).padStart(2, "0");
      const m = String(minutes % 60).padStart(2, "0");
      result.push(`${h}:${m}`);
    }
    return result;
  }, [dayHours, service]);

  const slotsKey = `${professionalId}|${date}`;
  const busySlots = slotState.key === slotsKey ? slotState.slots : [];

  // Carrega os horários já ocupados sempre que profissional/data mudam.
  useEffect(() => {
    if (!professionalId || !date) return;

    startTransition(async () => {
      const taken = await fetchBookedSlots(professionalId, date);
      setSlotState({ key: `${professionalId}|${date}`, slots: taken });
    });
  }, [professionalId, date]);

  // Se o profissional for alterado, a data precisa ser reavaliada.
  function handleProfessionalChange(id: string) {
    setProfessionalId(id);
    setTime("");
    if (!date) {
      const today = todayISO();
      setDate(today);
    }
  }

  function handleServiceChange(id: string) {
    setServiceId(id);
    setTime("");
  }

  function goNext() {
    setStep((current) => Math.min(current + 1, 4));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
  }

  if (state.status === "success" && state.booking) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center sm:p-12">
        <CircleCheck className="mx-auto size-14 text-brand-400" />
        <h2 className="display mt-6 text-3xl text-ink-50">Agendamento registrado</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-400">
          Guarde o código da reserva. Agora é só solicitar a confirmação pelo WhatsApp —
          a equipe responde em poucos minutos.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-ink-800 bg-ink-900/60 p-6 text-left">
          <dl className="grid gap-3 text-sm">
            {[
              ["Código", state.booking.code],
              ["Serviço", state.booking.serviceName],
              ["Profissional", state.booking.professionalName],
              ["Data", state.booking.date.split("-").reverse().join("/")],
              ["Horário", state.booking.time],
              ["Valor", formatCurrency(state.booking.priceCents)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">{label}</dt>
                <dd className="text-right font-medium text-ink-50">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {state.whatsappUrl && (
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-whatsapp mt-8 w-full sm:w-auto"
          >
            <MessageCircle className="size-4" />
            Solicitar confirmação no WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-ghost mt-3 w-full sm:w-auto"
        >
          Fazer outro agendamento
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progresso */}
      <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const done = step > item.id;
          const active = step === item.id;
          return (
            <li key={item.id} className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  if (done) setStep(item.id);
                }}
                disabled={!done && !active}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors sm:text-sm",
                  active && "border-brand-500 bg-brand-500/15 text-brand-300",
                  done && "border-ink-700 text-ink-200 hover:border-brand-600",
                  !done && !active && "border-ink-800 text-ink-600",
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px w-4 sm:w-8",
                    step > item.id ? "bg-brand-600" : "bg-ink-800",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="card mt-8 p-6 sm:p-8">
        {/* ---------------------------------------------------------------- */}
        {step === 1 && (
          <div>
            <h2 className="display text-2xl text-ink-50">Qual serviço você quer?</h2>
            <p className="mt-2 text-sm text-ink-400">
              Escolha um ou mais serviços. O valor total aparece na confirmação.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleServiceChange(item.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
                    serviceId === item.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-ink-800 hover:border-ink-700",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-50">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatDuration(item.durationMin)} · {item.category}
                    </p>
                    <p className="mt-1.5 font-display text-base text-brand-400">
                      {formatCurrency(item.priceCents)}
                    </p>
                  </div>
                  {serviceId === item.id && (
                    <Check className="size-5 shrink-0 text-brand-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 2 && (
          <div>
            <h2 className="display text-2xl text-ink-50">Com quem você quer cortar?</h2>
            <p className="mt-2 text-sm text-ink-400">
              Sem preferência? Deixe em “qualquer profissional” e a gente escala para
              você.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {professionals.map((item) => {
                const available = item.specialties.includes(service?.name ?? "");
                const selected = professionalId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProfessionalChange(item.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                      selected
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-ink-800 hover:border-ink-700",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-50">{item.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{item.role}</p>
                      {!available && (
                        <p className="mt-1 text-[0.65rem] text-ink-500">
                          Especialidade principal em outro serviço
                        </p>
                      )}
                    </div>
                    {selected && <Check className="size-5 shrink-0 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 3 && (
          <div>
            <h2 className="display text-2xl text-ink-50">Quando fica bom pra você?</h2>
            <p className="mt-2 text-sm text-ink-400">
              Mostramos apenas os horários livres de {professional?.name ?? "nossa equipe"}.
            </p>

            <div className="hide-scrollbar -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
              {dates.map((option) => {
                const dateValue = new Date(`${option}T12:00:00`);
                const weekday = dateValue.getDay();
                const closed = hours.find((h) => h.weekday === weekday)?.closed ?? false;
                const selected = date === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={closed}
                    onClick={() => {
                      setDate(option);
                      setTime("");
                    }}
                    className={cn(
                      "flex w-20 shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition-colors",
                      selected
                        ? "border-brand-500 bg-brand-500/10 text-brand-300"
                        : "border-ink-800 text-ink-300 hover:border-ink-700",
                      closed && "opacity-30",
                    )}
                  >
                    <span className="text-[0.65rem] tracking-wider uppercase">
                      {new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
                        .format(dateValue)
                        .replace(".", "")}
                    </span>
                    <span className="font-display mt-1 text-xl text-ink-50">
                      {dateValue.getDate()}
                    </span>
                    <span className="text-[0.6rem] text-ink-500">
                      {new Intl.DateTimeFormat("pt-BR", { month: "short" })
                        .format(dateValue)
                        .replace(".", "")}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {!date && (
                <p className="text-sm text-ink-500">Escolha um dia para ver os horários.</p>
              )}
              {date && dayHours?.closed && (
                <p className="text-sm text-ink-500">
                  Fechamos neste dia. Escolha outra data acima.
                </p>
              )}
              {date && !dayHours?.closed && (
                <>
                  <p className="flex items-center gap-2 text-xs text-ink-500">
                    <Clock className="size-3.5" />
                    {dayHours?.opensAt} às {dayHours?.closesAt}
                    {loadingSlots && " · carregando…"}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {slots.map((slot) => {
                      const taken = busySlots.includes(slot);
                      const selected = time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={taken}
                          onClick={() => setTime(slot)}
                          className={cn(
                            "rounded-xl border py-2.5 text-sm transition-colors",
                            selected
                              ? "border-brand-500 bg-brand-500/15 text-brand-300"
                              : taken
                                ? "border-ink-900 text-ink-600 line-through"
                                : "border-ink-800 text-ink-200 hover:border-brand-600",
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  {slots.length === 0 && (
                    <p className="mt-4 text-sm text-ink-500">
                      Não há horários disponíveis nesta data. Tente outro dia.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 4 && (
          <form action={formAction}>
            <h2 className="display text-2xl text-ink-50">Seus dados</h2>
            <p className="mt-2 text-sm text-ink-400">
              Usamos essas informações apenas para confirmar a reserva pelo WhatsApp.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">
                  Nome completo
                </label>
                <input id="name" name="name" className="input" required placeholder="Seu nome" />
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  className="input"
                  required
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  E-mail (opcional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder="voce@email.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="label">
                  Observações (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="input min-h-24 resize-y"
                  placeholder="Ex.: degrade alto nas laterais, barba curta..."
                />
              </div>
            </div>

            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="professionalId" value={professionalId} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={time} />

            {state.status === "error" && (
              <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {state.message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={goBack} className="btn btn-ghost">
                <ArrowLeft className="size-4" />
                Voltar
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary flex-1">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    Confirmar agendamento
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Navegação entre etapas (fora do formulário) */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="btn btn-ghost"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === 1 && !serviceId) ||
                (step === 2 && !professionalId) ||
                (step === 3 && (!date || !time))
              }
              className="btn btn-primary"
            >
              Continuar
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Resumo */}
      {service && (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-ink-800 bg-ink-900/40 px-5 py-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-ink-400">
            <span>
              {service.name}
              {professional ? ` · ${professional.name}` : ""}
              {date ? ` · ${date.split("-").reverse().join("/")}` : ""}
              {time ? ` às ${time}` : ""}
            </span>
            <span className="font-display text-lg text-brand-400">
              {formatCurrency(service.priceCents)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
