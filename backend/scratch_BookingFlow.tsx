"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr as trLocale } from "date-fns/locale";
import type { Matcher } from "react-day-picker";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { tr } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingStepper } from "./BookingStepper";
import { AvailabilityResults } from "./AvailabilityResults";
import { BookingSummary } from "./BookingSummary";
import { ApiError, createReservation, searchRooms, getAddons } from "@/lib/api";
import type { Room, Addon } from "@/lib/types";

const STEP_LABELS = [
  tr.reservation.steps.search,
  tr.reservation.steps.select,
  "Ekstralar",
  tr.reservation.steps.confirm,
];

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function BookingFlow({
  rooms,
  taxRate,
}: {
  rooms: Room[];
  taxRate: number;
}) {
  const params = useSearchParams();
  const reduceMotion = useReducedMotion();
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?required=true&redirect=/rezervasyon");
    }
  }, [user, isLoading, router]);

  const passportMissing = !user?.identityNumber?.trim();

  const [step, setStep] = useState(0);
  const [arrival, setArrival] = useState<Date | undefined>(() =>
    parseDate(params.get("arrival")),
  );
  const [departure, setDeparture] = useState<Date | undefined>(() =>
    parseDate(params.get("departure")),
  );
  const [guests, setGuests] = useState(params.get("guests") ?? "2");
  const [units, setUnits] = useState(params.get("units") ?? "1");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(() => {
    const slug = params.get("room");
    return slug ? (rooms.find((room) => room.slug === slug) ?? null) : null;
  });

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<Room[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  const canSearch = Boolean(arrival && departure);

  useEffect(() => {
    getAddons().then((res) => {
      setAddons(res);
    }).catch(console.error);
  }, []);

  async function handleSearch() {
    if (!arrival || !departure) return;

    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchRooms({
        arrival: format(arrival, "yyyy-MM-dd"),
        departure: format(departure, "yyyy-MM-dd"),
        guests: Number(guests),
        units: Number(units),
      });
      setSearchResults(results);
      setStep(1);
    } catch (err) {
      setSearchError(
        err instanceof ApiError
          ? err.message
          : "Uygun odalar aranırken bir hata oluştu, lütfen tekrar deneyin.",
      );
    } finally {
      setSearching(false);
    }
  }

  function toggleAddon(id: number) {
    setSelectedAddonIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  async function handleConfirm() {
    if (!selectedRoom || !arrival || !departure || !user || !token) return;
    if (passportMissing) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createReservation(
        {
          roomId: selectedRoom.id,
          checkIn: format(arrival, "yyyy-MM-dd"),
          checkOut: format(departure, "yyyy-MM-dd"),
          guestCount: Number(guests),
          guest: {
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            identityNumber: user.identityNumber!,
          },
          addonIds: selectedAddonIds,
        },
        token,
      );
      setConfirmed(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Rezervasyon gönderilemedi, lütfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="bg-canvas">
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand"
          >
            <CheckCircle2 className="size-8" strokeWidth={1.5} />
          </motion.div>
          <h1 className="mt-6 font-serif text-3xl text-ink">
            {tr.reservation.confirmed.heading}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/75">
            {tr.reservation.confirmed.body}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-none border border-brand px-8 text-[11px] tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-white"
          >
            {tr.reservation.confirmed.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-[880px] px-6 py-16 lg:py-24">
        <BookingStepper steps={STEP_LABELS} current={step} />

        <div
          className={cn(
            "mt-14",
            step === 1 || step === 2 || step === 3
              ? ""
              : "bg-surface p-6 shadow-lg sm:p-10 lg:p-12",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              {step === 0 && (
                <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8">
                  <DateField
                    label={tr.booking.arrival}
                    value={arrival}
                    onChange={setArrival}
                    disabled={{ before: new Date() }}
                  />
                  <DateField
                    label={tr.booking.departure}
                    value={departure}
                    onChange={setDeparture}
                    disabled={(date) => date <= (arrival ?? new Date())}
                  />
                  <CountField
                    label={tr.booking.guests}
                    value={guests}
                    onChange={setGuests}
                    render={tr.booking.guestCount}
                    options={[1, 2, 3, 4, 5, 6]}
                  />
                  <CountField
                    label={tr.booking.units}
                    value={units}
                    onChange={setUnits}
                    render={tr.booking.unitCount}
                    options={[1, 2, 3]}
                  />
                  {searchError && (
                    <p className="text-sm text-red-600 sm:col-span-2">{searchError}</p>
                  )}
                  <Button
                    disabled={!canSearch || searching}
                    onClick={handleSearch}
                    className="h-12 rounded-none bg-brand text-[11px] tracking-[0.14em] text-white hover:bg-brand-hover sm:col-span-2"
                  >
                    {searching ? tr.reservation.summary.submitting : tr.reservation.searchCta}
                  </Button>
                </div>
              )}

              {step === 1 && (
                <AvailabilityResults
                  rooms={searchResults}
                  onSelect={(room) => {
                    setSelectedRoom(room);
                    setStep(2); // Next is addons
                  }}
                />
              )}

              {step === 2 && (
                <div className="bg-surface p-6 shadow-lg sm:p-10">
                  <h2 className="mb-6 font-serif text-2xl text-ink">Ekstra Hizmetler (İsteğe Bağlı)</h2>
                  {addons.length === 0 ? (
                    <p className="text-sm text-ink/75">Şu an için seçilebilir ekstra bir hizmet bulunmuyor.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addons.map(addon => {
                        const isSelected = selectedAddonIds.includes(addon.id);
                        return (
                          <div 
                            key={addon.id}
                            onClick={() => toggleAddon(addon.id)}
                            className={cn(
                              "cursor-pointer border p-4 transition-colors",
                              isSelected ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-ink">{addon.name}</h3>
                              <span className="text-brand font-medium">₺{addon.price}</span>
                            </div>
                            <p className="text-xs text-ink/75">{addon.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <StepNav
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                    nextLabel="Devam Et"
                  />
                </div>
              )}

              {step === 3 && selectedRoom && arrival && departure && (
                <div>
                  <BookingSummary
                    room={selectedRoom}
                    arrival={arrival}
                    departure={departure}
                    guests={Number(guests)}
                    guestDetails={{
                      fullName: user?.fullName || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      identityNumber: user?.identityNumber || "",
                      country: "",
                      note: "",
                    }}
                    taxRate={taxRate}
                    selectedAddons={addons.filter(a => selectedAddonIds.includes(a.id))}
                  />
                  {passportMissing && (
                    <div className="mt-6 flex flex-col gap-3 border border-brand/30 bg-brand/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-brand">
                        {tr.reservation.passportRequired.message}
                      </p>
                      <Link
                        href="/profil?required=passport"
                        className="shrink-0 text-[11px] tracking-[0.14em] text-brand underline underline-offset-4 hover:text-brand-hover"
                      >
                        {tr.reservation.passportRequired.completeProfileCta}
                      </Link>
                    </div>
                  )}
                  {submitError && (
                    <p className="mt-6 text-sm text-red-600">{submitError}</p>
                  )}
                  <StepNav
                    onBack={() => setStep(2)}
                    onNext={handleConfirm}
                    nextDisabled={submitting || passportMissing}
                    nextLabel={
                      submitting
                        ? tr.reservation.summary.submitting
                        : tr.reservation.summary.confirmCta
                    }
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] tracking-[0.14em] text-label transition-colors hover:text-ink"
      >
        {tr.reservation.back}
      </button>
      <Button
        disabled={nextDisabled}
        onClick={onNext}
        className="h-11 rounded-none bg-brand px-8 text-[11px] tracking-[0.14em] text-white hover:bg-brand-hover"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled: Matcher | Matcher[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.14em] text-label">
        {label}
      </span>
      <Popover>
        <PopoverTrigger className="flex h-11 w-full items-center gap-2 border-b border-line text-left text-sm text-ink transition-colors hover:border-ink/40">
          <CalendarIcon className="size-4 shrink-0 text-label" strokeWidth={1.5} />
          <span className={cn(!value && "text-label")}>
            {value
              ? format(value, "d MMM yyyy", { locale: trLocale })
              : tr.booking.pickDate}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={trLocale}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CountField({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  render: (n: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.14em] text-label">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="h-11 w-full justify-between rounded-none border-0 border-b border-line px-0 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {render(n)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
