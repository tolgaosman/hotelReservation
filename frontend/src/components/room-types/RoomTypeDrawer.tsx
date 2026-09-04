"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { fieldError } from "@/lib/errors";
import type { RoomTypeDefinition } from "@/lib/types";

// The vocabulary offered when tagging a type's amenities — a fixed starter
// set, unioned below with whatever the type being edited already carries so
// an amenity typed elsewhere (or seeded) never silently disappears from view.
const AMENITY_OPTIONS = ["Deniz Manzarası", "Balkon", "Klima", "Mini Bar", "Jakuzi", "Wi-Fi", "Kasa", "Oda Servisi"];

interface FormHandle {
  submit(): void;
  remove(): void;
}

const RoomTypeForm = forwardRef<FormHandle, { roomType?: RoomTypeDefinition; isCreate: boolean; readOnly: boolean; onClose: () => void }>(
  function RoomTypeForm({ roomType, isCreate, readOnly, onClose }, ref) {
    const store = useStore();
    const showToast = useToast();

    const [name, setName] = useState(roomType?.name ?? "");
    const [description, setDescription] = useState(roomType?.description ?? "");
    const [capacity, setCapacity] = useState(roomType?.capacity ?? 2);
    const [nightlyRate, setNightlyRate] = useState(roomType?.nightlyRate ?? 1450);
    const [amenities, setAmenities] = useState<string[]>(roomType?.amenities ?? []);
    const [bedType, setBedType] = useState(roomType?.bedType ?? "");
    const [sizeM2, setSizeM2] = useState<number | "">(roomType?.sizeM2 ?? "");
    const [view, setView] = useState(roomType?.view ?? "");
    const [images, setImages] = useState<string[]>(roomType?.images ?? []);
    const [active, setActive] = useState(roomType?.active ?? true);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);

    const amenityOptions = Array.from(new Set([...AMENITY_OPTIONS, ...(roomType?.amenities ?? [])]));

    useImperativeHandle(ref, () => ({
      async submit() {
        setFieldErrors(undefined);
        if (!name.trim()) return setError("Oda tipi adı gereklidir.");
        if (!Number.isInteger(capacity) || capacity < 1) return setError("Kapasite en az 1 kişi olmalıdır.");
        if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) return setError("Gecelik ücret sıfırdan büyük olmalıdır.");
        const input = {
          name: name.trim(),
          description: description.trim() || null,
          capacity,
          nightlyRate,
          amenities,
          bedType: bedType.trim() || null,
          sizeM2: sizeM2 === "" ? null : sizeM2,
          view: view.trim() || null,
          images: images.filter((img) => img.trim() !== ""),
        };
        const result = isCreate
          ? await store.createRoomType(input)
          : await store.updateRoomType(roomType!.id, { ...input, active });
        if (!result.ok) {
          setFieldErrors(result.fieldErrors);
          return setError(result.error);
        }
        showToast(isCreate ? "Oda tipi eklendi." : "Oda tipi güncellendi.");
        onClose();
      },
      async remove() {
        if (!roomType) return;
        const result = await store.deleteRoomType(roomType.id);
        showToast(result.ok ? "Oda tipi silindi." : result.error, result.ok ? "success" : "error");
        if (result.ok) onClose();
      },
    }));

    function toggleAmenity(a: string) {
      setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
    }

    return (
      <div className="space-y-4">
        <FormField label="Ad" error={fieldError(fieldErrors, "name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Deluxe" disabled={readOnly} />
        </FormField>

        <FormField label="Açıklama" error={fieldError(fieldErrors, "description")}>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Misafirlere gösterilecek kısa açıklama" disabled={readOnly} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kapasite" error={fieldError(fieldErrors, "capacity")}>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} disabled={readOnly} />
          </FormField>
          <FormField label="Gecelik Ücret (₺)" error={fieldError(fieldErrors, "nightlyRate") ?? fieldError(fieldErrors, "nightly_rate")}>
            <Input type="number" min={0} value={nightlyRate} onChange={(e) => setNightlyRate(Number(e.target.value))} disabled={readOnly} />
          </FormField>
        </div>
        {!isCreate && (
          <p className="-mt-2 text-xs text-[var(--muted)]">
            Ücret değişikliği yalnızca yeni rezervasyonları etkiler; mevcut rezervasyonların tutarı değişmez.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Yatak Tipi">
            <Input value={bedType} onChange={(e) => setBedType(e.target.value)} placeholder="Örn. King" disabled={readOnly} />
          </FormField>
          <FormField label="Büyüklük (m²)">
            <Input type="number" min={1} value={sizeM2} onChange={(e) => setSizeM2(e.target.value === "" ? "" : Number(e.target.value))} disabled={readOnly} />
          </FormField>
        </div>

        <FormField label="Manzara">
          <Input value={view} onChange={(e) => setView(e.target.value)} placeholder="Örn. Deniz" disabled={readOnly} />
        </FormField>

        <FormField label="Resim URL (1 Adet)">
          <Input
            value={images[0] ?? ""}
            onChange={(e) => setImages(e.target.value ? [e.target.value] : [])}
            placeholder="https://..."
            disabled={readOnly}
          />
          {images[0] && (
            <div className="mt-2 aspect-video overflow-hidden rounded-md border border-[var(--line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0]} alt="Oda tipi resmi" className="h-full w-full object-cover" />
            </div>
          )}
        </FormField>

        <FormField label="Özellikler">
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((a) => (
              <button
                key={a}
                type="button"
                disabled={readOnly}
                onClick={() => toggleAmenity(a)}
                className={`rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  amenities.includes(a)
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                    : "border-[var(--line)] bg-[var(--surface-alt)] text-[var(--ink-soft)]"
                } ${readOnly ? "opacity-60 cursor-default" : ""}`}
              >
                {a}
              </button>
            ))}
          </div>
        </FormField>

        {!isCreate && (
          <FormField label="Durum">
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} label="Aktif" />
              <span className="text-xs text-[var(--muted)]">
                {active ? "Yeni oda atamalarında seçilebilir." : "Pasif — yeni odalara atanamaz, mevcut odalar etkilenmez."}
              </span>
            </div>
          </FormField>
        )}

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
      </div>
    );
  }
);

export function RoomTypeDrawer({ open, onClose, roomType }: { open: boolean; onClose: () => void; roomType?: RoomTypeDefinition }) {
  const { hasPermission } = useAuth();
  const formRef = useRef<FormHandle>(null);
  const isCreate = !roomType;
  const canSave = isCreate ? hasPermission("room_types.create") : hasPermission("room_types.edit");
  const canDelete = hasPermission("room_types.delete") && (roomType?.roomCount ?? 0) === 0;
  const readOnly = !canSave;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Yeni Oda Tipi" : roomType!.name}
      subtitle={isCreate ? "Odalar tarafından paylaşılan yeni bir tip tanımlayın" : "Oda tipi detaylarını düzenleyin"}
      footer={
        <>
          {!isCreate && canDelete && (
            <Button variant="danger" onClick={() => formRef.current?.remove()} className="mr-auto">
              Sil
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {canSave ? "Vazgeç" : "Kapat"}
          </Button>
          {canSave && <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Ekle" : "Kaydet"}</Button>}
        </>
      }
    >
      <RoomTypeForm key={open ? (roomType?.id ?? "new") : "closed"} ref={formRef} roomType={roomType} isCreate={isCreate} readOnly={readOnly} onClose={onClose} />
    </Drawer>
  );
}
