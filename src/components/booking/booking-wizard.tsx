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
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useActionState } from "react";

import {
  createBooking,
  fetchAvailableSlots,
  type BookingFormState,
} from "@/actions/booking";
import { contactLink } from "@/lib/whatsapp";
import type { BusinessHour, Professional, Service } from "@/lib/types";
import { addDaysISO, cn, formatCurrency, formatDuration, personInitials } from "@/lib/utils";
import { nowInStudioTZ } from "@/lib/schedule";

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
  // Chave por tentativa: o mesmo envio repetido não cria reserva nova no
  // servidor. "Fazer outro agendamento" recarrega a página e abre tentativa
  // nova.
  const [submitKey] = useState(() => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  });
  // Dados do contato controlados: o React reseta campos não controlados
  // depois de uma form action — em caso de erro, as escolhas teriam que
  // continuar preenchidas para o cliente só corrigir o necessário.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(() => {
    const selectedService = services.find(
      (item) => item.slug === initialServiceSlug,
    );

    if (!selectedService) return 1;

    const availableProfessionals = professionals.filter((item) =>
      item.specialties.includes(selectedService.name),
    );

    return availableProfessionals.length === 1 ? 3 : 2;
  });
  const [serviceId, setServiceId] = useState<string>(
    () => services.find((s) => s.slug === initialServiceSlug)?.id ?? "",
  );
  const [professionalId, setProfessionalId] = useState<string>(
    () => professionals.find((p) => p.slug === initialProfessionalSlug)?.id ?? "",
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotState, setSlotState] = useState<{
    key: string;
    slots: string[];
    windowText: string;
    closed: boolean;
    message: string | null;
  }>({ key: "", slots: [], windowText: "", closed: false, message: null });
  const [loadingSlots, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );
  const stepLabelRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Cada mudança de etapa leva o foco ao título ("Etapa X de Y") e rola até
  // o início do card — no celular, tocar Continuar não deixa o usuário sem
  // pistas de que a tela avançou (o conteúdo novo está logo abaixo).
  useEffect(() => {
    stepLabelRef.current?.focus();
  }, [step]);

  // Erro de solicitação (horário ocupado etc.): o foco e a mensagem aparecem
  // junto, e as escolhas continuam preenchidas para reenvio.
  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  const service = services.find((s) => s.id === serviceId) ?? null;

  // Serviço sem valor/duração cadastrados (ex.: exclusivos recém-aprovados):
  // não há encaixe na agenda para calcular — slots não são inventados. A
  // etapa 3 explica e encaminha ao WhatsApp; o servidor também recusa.
  const needsCadastro = Boolean(
    service && (service.durationMin == null || service.priceCents == null),
  );

  // Só quem executa o serviço escolhido entra na escolha — sem opção
  // “qualquer profissional”.
  const eligible = useMemo(
    () => professionals.filter((p) => p.specialties.includes(service?.name ?? "")),
    [professionals, service],
  );

  // Com um único profissional capaz, a seleção é automática e a etapa 2 é
  // pulada. Um profissional guardado que não executa o serviço (troca no
  // passo 1) não vale mais.
  const autoId = eligible.length === 1 ? eligible[0].id : "";
  const chosenValid = professionals.some(
    (p) => p.id === professionalId && p.specialties.includes(service?.name ?? ""),
  );
  const activeProfessionalId = chosenValid ? professionalId : autoId;
  const professional = professionals.find((p) => p.id === activeProfessionalId) ?? null;

  const dates = useMemo(() => {
    // Datas na referência do estúdio (America/Sao_Paulo), não do navegador.
    const start = nowInStudioTZ().date;
    return Array.from({ length: 21 }, (_, index) => addDaysISO(start, index));
  }, []);

  const dayHours = useMemo(() => {
    if (!date) return null;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return hours.find((hour) => hour.weekday === weekday) ?? null;
  }, [date, hours]);

  const slotsKey = `${activeProfessionalId}|${serviceId}|${date}`;
  const slotInfo = slotState.key === slotsKey ? slotState : null;

  // Horários vêm sempre do servidor: expediente individual, exceções do
  // dia, duração do serviço e reservas válidas não podem ser calculadas
  // no navegador. `state` no disparo cobre o caso do horário que fica
  // ocupado no último instante: o erro resultante recarrega a agenda.
  useEffect(() => {
    if (!activeProfessionalId || !serviceId || !date) return;

    startTransition(async () => {
      const info = await fetchAvailableSlots(activeProfessionalId, date, serviceId);
      setSlotState({
        key: `${activeProfessionalId}|${serviceId}|${date}`,
        slots: info.slots,
        windowText: info.windowText,
        closed: info.closed,
        message: info.message,
      });
    });
  }, [activeProfessionalId, serviceId, date, service?.durationMin, state]);

  // Se o profissional for alterado, a data precisa ser reavaliada.
  function handleProfessionalChange(id: string) {
    setProfessionalId(id);
    setTime("");
    if (!date) {
      setDate(nowInStudioTZ().date);
    }
  }

  function handleServiceChange(id: string) {
    setServiceId(id);
    setTime("");

    const chosen = services.find((s) => s.id === id);
    if (!chosen) return setProfessionalId("");

    const matches = professionals.filter((p) => p.specialties.includes(chosen.name));
    // Escolha explícita: só seleciona sozinho quando existe um único capaz.
    if (matches.length === 1) setProfessionalId(matches[0].id);
    else if (!matches.some((p) => p.id === professionalId)) setProfessionalId("");
  }

  function goNext() {
    setStep((current) => {
      // Profissional único: etapa 2 não aparece (só se o cliente voltar).
      if (current === 1 && eligible.length === 1) return 3;
      return Math.min(current + 1, 4);
    });
  }

  function goBack() {
    setStep((current) => {
      if (current === 3 && eligible.length === 1) return 1;
      return Math.max(current - 1, 1);
    });
  }

  if (state.status === "success" && state.booking) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center sm:p-12">
        <CircleCheck className="mx-auto size-14 text-brand-400" />
        <h2 className="display mt-6 text-3xl text-ink-50">Solicitação registrada</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-400">
          Seu horário está reservado em caráter de <strong>espera</strong>. Agora a
          equipe precisa confirmar no painel — só depois disso é agendamento
          confirmado.
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
          {state.expiresAt && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-200">
              Prazo da solicitação: válida até <strong>{state.expiresAt}</strong>{" "}
              ({state.holdMinutes} min). Sem confirmação da equipe até lá, o horário
              volta a ficar livre e a solicitação não pode mais ser confirmada.
            </p>
          )}
        </div>

        {state.whatsappUrl && (
          <>
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp mt-8 w-full sm:w-auto"
            >
              <MessageCircle className="size-4" />
              Solicitar confirmação no WhatsApp
            </a>
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-xs text-ink-400 underline underline-offset-4 hover:text-ink-200"
            >
              O WhatsApp não abriu? Use este mesmo pedido para tentar novamente.
            </a>
          </>
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
      <p
        ref={stepLabelRef}
        tabIndex={-1}
        aria-live="polite"
        className="mx-auto max-w-max rounded-full bg-ink-900/40 px-4 py-1.5 text-xs font-medium text-ink-300 outline-none focus:ring-2 focus:ring-brand-500"
      >
        Etapa {step} de {STEPS.length} · {STEPS[step - 1]?.label}
      </p>
      <ol className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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
                aria-current={active ? "step" : undefined}
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
              Escolha o serviço. O valor aparece no resumo da reserva.
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
                      {item.durationMin != null && `${formatDuration(item.durationMin)} · `}
                      {item.category}
                    </p>
                    {/* Preço só aparece quando está cadastrado; sem cadastro
                        nada é inventado. */}
                    {item.priceCents != null && (
                      <p className="mt-1.5 font-display text-base text-brand-400">
                        {formatCurrency(item.priceCents)}
                      </p>
                    )}
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
            <h2 className="display text-2xl text-ink-50">Quem vai atender você?</h2>
            <p className="mt-2 text-sm text-ink-400">
              Só aparecem quem executa este serviço. Cada profissional tem agenda
              própria.
            </p>

            {eligible.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-6 text-center">
                <p className="text-sm text-ink-400">
                  Ainda não há profissional no cadastro para
                  {` ${service?.name ?? "este serviço"}`}. Combine diretamente com a
                  equipe pelo WhatsApp.
                </p>
                <a
                  href={contactLink(
                    `Olá! Queria agendar ${service?.name ?? "um serviço"}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp mt-4 w-full sm:w-auto"
                >
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {eligible.map((item) => {
                  const selected = activeProfessionalId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleProfessionalChange(item.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-ink-800 hover:border-ink-700",
                      )}
                    >
                      {item.photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.photoUrl}
                          alt=""
                          className="size-14 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        // Sem foto cadastrada: iniciais, nada inventado.
                        <span
                          aria-hidden
                          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink-800 font-display text-base text-brand-300"
                        >
                          {personInitials(item.name) || "?"}
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink-50">{item.name}</p>
                        {item.role && (
                          <p className="mt-0.5 text-xs text-ink-500">{item.role}</p>
                        )}
                        {item.specialties.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {item.specialties.map((specialty) => (
                              <li
                                key={specialty}
                                className="rounded-full border border-ink-800 px-2 py-0.5 text-[0.65rem] text-ink-400"
                              >
                                {specialty}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {selected && <Check className="size-5 shrink-0 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {step === 3 && (
          <div>
            <h2 className="display text-2xl text-ink-50">Quando fica bom pra você?</h2>

            {needsCadastro ? (
              // Serviço aprovado, mas sem valor/duração cadastrados: nenhum
              // horário é exibido, o servidor também recusa. A gente só
              // encaminha para combinar direto com a equipe.
              <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
                <p className="text-sm leading-relaxed text-ink-400">
                  {service?.name} ainda não tem duração e valor completos no
                  cadastro, então não aparece nenhum horário aqui. Fale com a
                  gente no WhatsApp que combinamos tudo certinho, por favor.
                </p>
                <a
                  // Consulta também abre no chat do profissional escolhido
                  // (nos exclusivos é o Neto, selecionado automaticamente).
                  href={contactLink(
                    `Olá! Queria agendar ${service?.name ?? "um serviço"}. Vi no site que precisamos combinar valor e duração.`,
                    professional?.phone || undefined,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp mt-4 w-full sm:w-auto"
                >
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </div>
            ) : (
              <>
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
                      O estúdio está fechado neste dia da semana. Escolha outra data.
                    </p>
                  )}
                  {date && !dayHours?.closed && !slotInfo && (
                    <p className="text-sm text-ink-500">Carregando horários…</p>
                  )}
                  {date && !dayHours?.closed && slotInfo?.closed && (
                    <p aria-live="polite" className="text-sm text-ink-500">
                      {slotInfo.message ??
                        "O profissional está fechado nesta data ou tem ajuste de agenda. Escolha outra data, por favor."}
                    </p>
                  )}
                  {date && !dayHours?.closed && slotInfo && !slotInfo.closed && (
                    <>
                      <p className="flex items-center gap-2 text-xs text-ink-500">
                        <Clock className="size-3.5" />
                        {slotInfo.windowText}
                        {loadingSlots ? " · atualizando…" : ""}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                        {slotInfo.slots.map((slot) => {
                          const selected = time === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setTime(slot)}
                              className={cn(
                                "rounded-xl border py-2.5 text-sm transition-colors",
                                selected
                                  ? "border-brand-500 bg-brand-500/15 text-brand-300"
                                  : "border-ink-800 text-ink-200 hover:border-brand-600",
                              )}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-ink-500">
                        {loadingSlots
                          ? "Carregando horários…"
                          : (slotInfo.message ??
                            (slotInfo.slots.length === 0
                              ? "Não há horários livres nesta data. Tente outro dia."
                              : ""))}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
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
                <input
                  id="name"
                  name="name"
                  className="input"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
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
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>

            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="professionalId" value={activeProfessionalId} />
            <input type="hidden" name="idempotencyKey" value={submitKey} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={time} />

            {state.status === "error" && (
              <p
                ref={errorRef}
                tabIndex={-1}
                className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 outline-none focus:ring-2 focus:ring-red-400"
              >
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
          <div className="mt-8">
            {/* Serviço sem duração cadastrada: o botão de avançar nem aparece.
                Antes ficava desabilitado e no celular parecia que o toque não
                fazia nada — a consulta real é pelo WhatsApp, com o Block passo
                explicado no aviso acima. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="btn btn-ghost"
              >
                <ArrowLeft className="size-4" />
                Voltar
              </button>

              {!(step === 3 && needsCadastro) && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    (step === 1 && !serviceId) ||
                    (step === 2 && !activeProfessionalId) ||
                    // Sem valor/duração cadastrados a reserva é recusada pelo
                    // servidor: não faz sentido deixar avançar.
                    (step === 3 && (!date || !time))
                  }
                  className="btn btn-primary sm:ml-auto"
                >
                  Continuar
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>

            {/* Validação visível junto do botão: nada fica silencioso. Mesmo
                desabilitado, o texto explica exatamente o que falta. */}
            <p
              aria-live="polite"
              className="mt-3 min-h-5 text-xs leading-relaxed text-ink-500"
            >
              {step === 1 && !serviceId
                ? "Escolha um serviço para continuar."
                : step === 2 && !activeProfessionalId
                  ? "Escolha quem vai atender você para continuar."
                  : step === 3 && needsCadastro
                    ? `Para liberar horários online falta cadastrar a duração de ${service?.name ?? "este serviço"} — enquanto isso, combine pelo WhatsApp.`
                    : step === 3 && !date
                      ? `Escolha uma data do expediente de ${professional?.name ?? "nosso profissional"} para ver e selecionar o horário.`
                      : step === 3 && date && !slotInfo
                        ? "Buscando horários…"
                        : step === 3 && date && slotInfo?.closed
                          ? "Este dia está fechado na agenda — escolha outra data."
                          : step === 3 && date && slotInfo && !time
                            ? "Escolha um horário livre para continuar."
                            : ""}
            </p>
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
            {service.priceCents != null && (
              <span className="font-display text-lg text-brand-400">
                {formatCurrency(service.priceCents)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
