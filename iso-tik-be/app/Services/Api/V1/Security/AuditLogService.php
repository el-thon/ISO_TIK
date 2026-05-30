<?php

namespace App\Services\Api\V1\Security;

use App\Models\Security\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogService
{
    public function record(?User $actor, string $entityType, string $entityId, string $action, array $details = [], ?Request $request = null): void
    {
        AuditLog::create([
            'actor_user_id' => $actor?->id,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'severity' => 'info',
            'category' => 'admin',
            'details' => $details,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'timestamp' => now(),
        ]);
    }
}
