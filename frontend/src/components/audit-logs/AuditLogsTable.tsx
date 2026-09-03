"use client";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";
import {
  Activity,
  CheckCircle2,
  Edit3,
  LogIn,
  LogOut,
  PlusCircle,
  Trash2,
  XCircle,
  ShieldAlert,
  UserCircle2,
  Laptop
} from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  "reservation.create": "Rezervasyon Oluşturuldu",
  "reservation.update": "Rezervasyon Güncellendi",
  "reservation.confirm": "Rezervasyon Onaylandı",
  "reservation.cancel": "Rezervasyon İptal Edildi",
  "reservation.check_in": "Check-in Yapıldı",
  "reservation.check_out": "Check-out Yapıldı",
  "payment.create": "Ödeme Alındı",
  "room_service.create": "Oda Servisi Eklendi",
  "room_service.delete": "Oda Servisi Silindi",
  "room.create": "Oda Eklendi",
  "room.update": "Oda Güncellendi",
  "room.deactivate": "Oda Kullanıma Kapatıldı",
  "room.activate": "Oda Kullanıma Açıldı",
  "room.housekeeping_update": "Temizlik Durumu Güncellendi",
  "room_type.create": "Oda Tipi Eklendi",
  "room_type.update": "Oda Tipi Güncellendi",
  "room_type.delete": "Oda Tipi Silindi",
  "role.create": "Rol Oluşturuldu",
  "role.update": "Rol Güncellendi",
  "role.delete": "Rol Silindi",
  "guest.create": "Misafir Eklendi",
  "guest.update": "Misafir Güncellendi",
  "employee.create": "Çalışan Eklendi",
  "employee.update": "Çalışan Güncellendi",
  "auth.login": "Sisteme Giriş Yapıldı",
  "auth.logout": "Sistemden Çıkış Yapıldı"
};

const TYPE_LABELS: Record<string, string> = {
  "Reservation": "Rezervasyon",
  "Payment": "Ödeme",
  "RoomService": "Oda Servisi",
  "Room": "Oda",
  "Role": "Rol",
  "Guest": "Misafir",
  "Employee": "Çalışan",
  "User": "Kullanıcı"
};

function getActionStyle(action: string) {
  if (action.includes("create") || action.includes("confirm") || action.includes("check_in") || action.includes("activate")) {
    return {
      color: "text-[var(--ok)]",
      bg: "bg-[var(--ok-soft)]",
      border: "border-[var(--ok)]/30",
      icon: action.includes("confirm") || action.includes("check_in") ? CheckCircle2 : PlusCircle
    };
  }
  if (action.includes("delete") || action.includes("cancel") || action.includes("deactivate")) {
    return {
      color: "text-[var(--crit)]",
      bg: "bg-[var(--crit-soft)]",
      border: "border-[var(--crit)]/30",
      icon: action.includes("delete") ? Trash2 : XCircle
    };
  }
  if (action === "auth.login") {
    return {
      color: "text-[var(--accent)]",
      bg: "bg-[var(--accent-soft)]",
      border: "border-[var(--accent)]/30",
      icon: LogIn
    };
  }
  if (action === "auth.logout") {
    return {
      color: "text-[var(--muted)]",
      bg: "bg-[var(--surface-alt)]",
      border: "border-[var(--line-strong)]",
      icon: LogOut
    };
  }
  if (action.includes("update") || action.includes("edit") || action.includes("housekeeping")) {
    return {
      color: "text-[var(--info)]",
      bg: "bg-[var(--info-soft)]",
      border: "border-[var(--info)]/30",
      icon: Edit3
    };
  }
  
  return {
    color: "text-[var(--ink-soft)]",
    bg: "bg-[var(--line)]",
    border: "border-[var(--line-strong)]",
    icon: Activity
  };
}

export function AuditLogsTable({
  logs,
  page,
  pageCount,
  total,
  onPageChange,
  actionFilter,
  onActionFilterChange,
  typeFilter,
  onTypeFilterChange,
}: {
  logs: AuditLog[];
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  actionFilter?: string;
  onActionFilterChange?: (val: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (val: string) => void;
}) {
  const filterAction = (
    <div className="flex gap-3">
      {onTypeFilterChange && (
        <Select 
          align="right" 
          value={typeFilter || ""} 
          onChange={(e) => {
            onTypeFilterChange(e.target.value);
            if (onActionFilterChange) onActionFilterChange("");
          }} 
          className="w-[170px]"
        >
          <option value="">Tüm Modüller</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>
      )}
      {onActionFilterChange && (
        <Select align="right" value={actionFilter || ""} onChange={(e) => onActionFilterChange(e.target.value)} className="w-[240px]">
          <option value="">Tüm Aksiyonlar</option>
          {Object.entries(ACTION_LABELS)
            .filter(([val]) => {
              if (!typeFilter) return true;
              const prefixMap: Record<string, string> = {
                "Reservation": "reservation.",
                "Payment": "payment.",
                "RoomService": "room_service.",
                "Room": "room.",
                "Role": "role.",
                "Guest": "guest.",
                "Employee": "employee.",
                "User": "auth."
              };
              const prefix = prefixMap[typeFilter] || "";
              return val.startsWith(prefix);
            })
            .map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
        </Select>
      )}
    </div>
  );

  return (
    <Card title="Aktivite Kayıtları" subtitle={`${total} kayıt`} action={filterAction} overflowHidden={false}>
      {logs.length === 0 ? (
        <EmptyState title="Henüz aktivite kaydı yok" description="Sistemde işlem yapıldıkça burada listelenecek." />
      ) : (
        <div className="flex flex-col">
          <div className="relative pl-6 sm:pl-8 pr-4 sm:pr-8 py-2">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] sm:left-[23px] top-6 bottom-4 w-px bg-[var(--line)]" />
            
            <div className="flex flex-col gap-6">
              {logs.map((log) => {
                const style = getActionStyle(log.action);
                const Icon = style.icon;
                const label = ACTION_LABELS[log.action] || log.action;
                const contextText = log.auditableType ? `${TYPE_LABELS[log.auditableType] || log.auditableType} #${log.auditableId}` : null;
                
                return (
                  <div key={log.id} className="group relative flex gap-4 sm:gap-6 animate-in slide-in-from-bottom-2 fade-in duration-300 [transition-timing-function:var(--ease-organic)]">
                    {/* Timeline icon node */}
                    <div className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface)] transition-transform duration-300 group-hover:scale-110",
                      style.color,
                      style.border
                    )}>
                      <Icon size={14} strokeWidth={2.5} />
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-200 hover:border-[var(--line-strong)] hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {log.userName ? (
                            <>
                              <UserCircle2 size={16} className="text-[var(--accent)]" />
                              <span className="font-semibold text-sm text-[var(--ink)]">{log.userName}</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert size={16} className="text-[var(--warn)]" />
                              <span className="font-semibold text-sm text-[var(--ink)]">Sistem</span>
                            </>
                          )}
                        </div>
                        <time className="text-xs font-medium text-[var(--muted)] tabular-nums">
                          {formatDateTime(log.createdAt)}
                        </time>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold",
                            style.bg,
                            style.color
                          )}>
                            {label}
                          </span>
                          
                          {contextText && (
                            <span className="text-sm font-medium text-[var(--ink-soft)]">
                              • <span className="ml-1 text-[var(--ink)]">{contextText}</span>
                            </span>
                          )}
                        </div>

                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="flex-1 flex justify-center items-center px-2 sm:px-4 min-w-0">
                            <div className="text-[12px] text-[var(--ink)] font-medium text-center py-1.5 px-3 bg-[var(--surface-alt)]/50 rounded-md border border-[var(--line)]/50 truncate w-full max-w-lg">
                              {(() => {
                                const c = log.changes as any;
                                const parts: string[] = [];
                                
                                const FIELD_LABELS: Record<string, string> = {
                                  status: "Durum",
                                  nightly_rate: "Gecelik Ücret",
                                  nightlyRate: "Gecelik Ücret",
                                  capacity: "Kapasite",
                                  number: "Oda Numarası",
                                  type: "Oda Tipi",
                                  name: "Ad",
                                  active: "Aktif",
                                  bed_type: "Yatak Tipi",
                                  bedType: "Yatak Tipi",
                                  size_m2: "Büyüklük (m²)",
                                  sizeM2: "Büyüklük (m²)",
                                  view: "Manzara",
                                  check_in: "Giriş Tarihi",
                                  checkIn: "Giriş Tarihi",
                                  check_out: "Çıkış Tarihi",
                                  checkOut: "Çıkış Tarihi",
                                  guest_count: "Kişi Sayısı",
                                  guestCount: "Kişi Sayısı",
                                  amount: "Tutar",
                                  description: "Açıklama",
                                  maintenance_note: "Bakım Notu",
                                  maintenanceNote: "Bakım Notu",
                                  role_id: "Rol",
                                  roleId: "Rol",
                                  full_name: "Ad Soyad",
                                  fullName: "Ad Soyad",
                                  profession: "Meslek",
                                  department: "Departman",
                                  phone: "Telefon",
                                  email: "E-posta",
                                  notes: "Notlar"
                                };

                                const formatVal = (val: any) => {
                                  if (val === true || val === "true" || val === 1) return "Evet";
                                  if (val === false || val === "false" || val === 0) return "Hayır";
                                  if (val === "clean") return "Temiz";
                                  if (val === "dirty") return "Kirli";
                                  if (val === "cleaning") return "Temizlikte";
                                  if (val === "available") return "Müsait";
                                  if (val === "occupied") return "Dolu";
                                  if (val === "maintenance") return "Bakımda";
                                  if (val === "passive") return "Pasif";
                                  return val;
                                };
                                
                                if (c.attributes) {
                                  const attrs = c.attributes;
                                  const old = c.old || {};
                                  
                                  for (const key of Object.keys(attrs)) {
                                    if (['updated_at', 'created_at', 'id', 'password'].includes(key)) continue;
                                    const oldValRaw = old[key];
                                    const newValRaw = attrs[key];
                                    
                                    if (oldValRaw !== newValRaw) {
                                      if (key === 'is_priority_cleaning' || key === 'isPriorityCleaning') {
                                        parts.push(newValRaw ? "Öncelikli temizliğe alındı" : "Öncelikli temizlikten çıkarıldı");
                                      } else if (key === 'is_maintenance' || key === 'isMaintenance') {
                                        parts.push(newValRaw ? "Bakıma alındı" : "Bakımdan çıkarıldı");
                                      } else if (key === 'housekeeping_status' || key === 'housekeepingStatus') {
                                        parts.push(`Temizlik durumu "${formatVal(newValRaw)}" yapıldı`);
                                      } else if (key === 'assignedStaff' || key === 'assigned_staff') {
                                        parts.push(newValRaw ? `Görevli olarak ${newValRaw} atandı` : "Görevli ataması kaldırıldı");
                                      } else {
                                        const field = FIELD_LABELS[key] || key;
                                        const oldV = oldValRaw !== null && oldValRaw !== undefined && oldValRaw !== "" ? formatVal(oldValRaw) : 'Boş';
                                        const newV = newValRaw !== null && newValRaw !== undefined && newValRaw !== "" ? formatVal(newValRaw) : 'Boş';
                                        parts.push(`${field}, "${oldV}" yerine "${newV}" yapıldı`);
                                      }
                                    }
                                  }
                                  return parts.length > 0 ? parts.join(' | ') : "Sistem kaydı güncellendi.";
                                }
                                
                                for (const [key, value] of Object.entries(c)) {
                                  if (typeof value !== 'object') {
                                    if (key === 'is_priority_cleaning' || key === 'isPriorityCleaning') {
                                      parts.push(value ? "Öncelikli temizliğe alındı" : "Öncelikli temizlikten çıkarıldı");
                                    } else if (key === 'is_maintenance' || key === 'isMaintenance') {
                                      parts.push(value ? "Bakıma alındı" : "Bakımdan çıkarıldı");
                                    } else if (key === 'housekeeping_status' || key === 'housekeepingStatus') {
                                      parts.push(`Temizlik durumu "${formatVal(value)}" yapıldı`);
                                    } else if (key === 'assignedStaff' || key === 'assigned_staff') {
                                      parts.push(value ? `Görevli olarak ${value} atandı` : "Görevli ataması kaldırıldı");
                                    } else {
                                      const field = FIELD_LABELS[key] || key;
                                      const val = formatVal(value);
                                      parts.push(`${field}: ${val}`);
                                    }
                                  }
                                }
                                return parts.length > 0 ? parts.join(' | ') : null;
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {log.ipAddress && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] bg-[var(--surface-alt)] px-2 py-1 rounded-md shrink-0">
                            <Laptop size={12} />
                            <span className="font-mono tabular-nums">{log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 border-t border-[var(--line)] pt-6">
            <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} totalLabel={`${total} kayıttan sayfa ${page}/${pageCount}`} />
          </div>
        </div>
      )}
    </Card>
  );
}
