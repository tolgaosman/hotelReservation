<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuditLogService
{
    /**
     * Records one domain action. Never throws â€” a logging failure must not
     * break the underlying business action it's recording, so any error is
     * swallowed and written to the application log instead.
     */
    public function record(string $action, ?Model $subject = null, array $changes = []): void
    {
        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'auditable_type' => $subject ? class_basename($subject) : null,
                'auditable_id' => $subject?->getKey(),
                'changes' => $changes ?: null,
                'ip_address' => request()->ip(),
            ]);
        } catch (Throwable $e) {
            Log::error('Aktivite kaydÄ± oluÅŸturulamadÄ±: '.$e->getMessage());
        }
    }
}
