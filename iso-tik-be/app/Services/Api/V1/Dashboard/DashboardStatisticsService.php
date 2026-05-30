<?php

namespace App\Services\Api\V1\Dashboard;

use App\Http\Resources\Api\V1\UserResource;
use App\Models\Auth\LoginHistory;
use App\Models\Auth\Role;
use App\Models\Auth\SessionToken;
use App\Models\Auth\UserRole;
use App\Models\Collaboration\Forum;
use App\Models\Collaboration\ForumParticipant;
use App\Models\Collaboration\ForumPeriod;
use App\Models\Collaboration\ForumPeriodJoinRequest;
use App\Models\Collaboration\ForumPeriodMember;
use App\Models\Content\Attachment;
use App\Models\Content\Document;
use App\Models\Content\InputItem;
use App\Models\Content\Topic;
use App\Models\Content\TopicDocumentMaster;
use App\Models\Content\TopicVersion;
use App\Models\Security\AuditLog;
use App\Models\System\Clause;
use App\Models\System\Setting;
use App\Models\User;
use App\Models\Workflow\WorkflowState;
use App\Support\Api\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardStatisticsService
{
    public function handle(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $user = $request->user();
        $global = $user?->hasAnyRole(['admin', 'product_owner']) || ! $filters['mine'];

        $statistics = [
            'users' => $this->userStatistics(),
            'periods' => $this->periodStatistics($filters, $user, $global),
            'rooms' => $this->periodStatistics($filters, $user, $global),
            'forums' => $this->forumStatistics($filters, $user, $global),
            'topics' => $this->topicStatistics($filters, $user, $global),
            'input_items' => $this->inputItemStatistics($filters, $user, $global),
            'findings' => $this->inputItemStatistics($filters, $user, $global),
            'attachments' => ['total' => $this->attachmentQuery($filters, $user, $global)->count()],
            'documents' => ['total' => Document::count(), 'active' => Document::count()],
            'clauses' => ['total' => Clause::count(), 'active' => Clause::active()->count()],
            'topic_document_masters' => ['total' => TopicDocumentMaster::count(), 'active' => TopicDocumentMaster::active()->count()],
            'settings' => ['total' => Setting::count()],
            'sessions' => ['active' => SessionToken::whereNull('revoked_at')->where('expires_at', '>', now())->count()],
            'login_history' => ['total' => LoginHistory::count(), 'success' => LoginHistory::where('status', 'success')->count()],
            'versions' => ['total' => TopicVersion::count()],
            'workflow' => ['total' => WorkflowState::count()],
        ];

        $statistics['forums_per_room'] = $this->forumsPerRoom($filters, $user, $global);
        $statistics['discrepancy_forms_per_forum'] = $this->discrepancyFormsPerForum($filters, $user, $global);

        $summary = $this->summary($statistics);
        $cards = $this->cards($summary);
        $charts = $this->charts($statistics);
        $recent = $this->recentActivities();

        $payload = [
            'statistics' => $statistics,
            'my_statistics' => $this->myStatistics($user),
            'stats' => $statistics,
            'summary' => $summary,
            'cards' => $cards,
            'charts' => $charts,
            'recent_activities' => $recent,
            'recentActivities' => $recent,
            'scope' => $global ? 'global' : 'mine',
            'role' => $this->role($user),
        ];

        return ApiResponse::success($payload, 'Dashboard statistics retrieved successfully', 200, array_merge($payload, $this->flatAliases($summary)));
    }

    private function filters(Request $request): array
    {
        return [
            'period_id' => $request->input('period_id'),
            'forum_id' => $request->input('forum_id'),
            'date_from' => $request->input('date_from') ?: $request->input('from') ?: $request->input('start_date'),
            'date_to' => $request->input('date_to') ?: $request->input('to') ?: $request->input('end_date'),
            'finding_type' => $request->input('finding_type'),
            'status' => $request->input('status') ?: $request->input('workflow_status'),
            'mine' => $request->boolean('mine'),
        ];
    }

    private function userStatistics(): array
    {
        $roles = [];
        foreach (['admin', 'product_owner', 'member'] as $role) {
            $roles[$role] = UserRole::active()->whereHas('role', fn ($q) => $q->where('name', $role))->distinct('user_id')->count('user_id');
        }

        return [
            'total' => User::count(),
            'active' => User::where('status', 'active')->count(),
            'inactive' => User::where('status', '!=', 'active')->count(),
            'deleted' => User::onlyTrashed()->count(),
            'by_role' => $roles,
            'admin' => $roles['admin'],
            'product_owner' => $roles['product_owner'],
            'member' => $roles['member'],
        ];
    }

    private function periodStatistics(array $filters, ?User $user, bool $global): array
    {
        $query = $this->periodQuery($filters, $user, $global);

        return [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->active()->count(),
            'period_members_count' => ForumPeriodMember::count(),
            'pending_join_requests' => ForumPeriodJoinRequest::where('status', 'pending')->count(),
            'passed_deadline' => (clone $query)->whereNotNull('end_date')->where('end_date', '<', now()->toDateString())->count(),
        ];
    }

    private function forumStatistics(array $filters, ?User $user, bool $global): array
    {
        $query = $this->forumQuery($filters, $user, $global);

        return [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('is_archived', false)->count(),
            'locked' => (clone $query)->where('is_locked', true)->count(),
            'archived' => (clone $query)->where('is_archived', true)->count(),
            'participants_count' => ForumParticipant::active()->count(),
        ];
    }

    private function topicStatistics(array $filters, ?User $user, bool $global): array
    {
        $query = $this->topicQuery($filters, $user, $global);
        $statuses = ['draft', 'approved', 'changes_requested', 'closed'];

        $data = ['total' => (clone $query)->count()];
        foreach ($statuses as $status) {
            $data[$status] = (clone $query)->where('status', $status)->count();
        }
        $reviewCount = (clone $query)->whereIn('status', ['in_review', 'published'])->count();
        $data['in_review'] = $reviewCount;
        $data['published'] = $reviewCount;
        $data['frozen'] = (clone $query)->where('is_frozen', true)->count();

        return $data;
    }

    private function inputItemStatistics(array $filters, ?User $user, bool $global): array
    {
        $query = $this->inputItemQuery($filters, $user, $global);
        $byType = (clone $query)->selectRaw('type, count(*) as total')->groupBy('type')->pluck('total', 'type')->map(fn ($value) => (int) $value)->all();

        return [
            'total' => (clone $query)->count(),
            'total_findings' => (clone $query)->where('type', 'finding')->count(),
            'by_type' => $byType,
        ];
    }

    private function periodQuery(array $filters, ?User $user, bool $global): Builder
    {
        return ForumPeriod::query()
            ->when($filters['period_id'], fn ($q, $id) => $q->where('id', $id))
            ->when(! $global && $user, fn ($q) => $q->whereHas('members', fn ($m) => $m->where('user_id', $user->id)))
            ->when($filters['date_from'], fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn ($q, $date) => $q->whereDate('created_at', '<=', $date));
    }

    private function forumQuery(array $filters, ?User $user, bool $global): Builder
    {
        return Forum::query()
            ->when($filters['period_id'], fn ($q, $id) => $q->where('forum_period_id', $id))
            ->when($filters['forum_id'], fn ($q, $id) => $q->where('id', $id))
            ->when(! $global && $user, fn ($q) => $q->whereHas('participants', fn ($p) => $p->where('user_id', $user->id)->whereNull('removed_at')))
            ->when($filters['date_from'], fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn ($q, $date) => $q->whereDate('created_at', '<=', $date));
    }

    private function topicQuery(array $filters, ?User $user, bool $global): Builder
    {
        return Topic::query()
            ->when($filters['forum_id'], fn ($q, $id) => $q->where('forum_id', $id))
            ->when($filters['period_id'], fn ($q, $id) => $q->whereHas('forum', fn ($f) => $f->where('forum_period_id', $id)))
            ->when($filters['status'], fn ($q, $status) => $q->whereIn('status', $this->statusVariants($status)))
            ->when($filters['mine'] && $user, fn ($q) => $q->where('created_by_user_id', $user->id))
            ->when(! $global && $user, fn ($q) => $q->whereHas('forum.participants', fn ($p) => $p->where('user_id', $user->id)->whereNull('removed_at')))
            ->when($filters['date_from'], fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn ($q, $date) => $q->whereDate('created_at', '<=', $date));
    }

    private function inputItemQuery(array $filters, ?User $user, bool $global): Builder
    {
        return InputItem::query()
            ->when($filters['finding_type'], fn ($q, $type) => $q->where(function ($inner) use ($type) {
                $inner->where('type', $type)
                    ->orWhere('metadata->finding_type', $type)
                    ->orWhere('metadata->type', $type);
            }))
            ->whereHas('topic', fn ($q) => $this->applyTopicFilters($q, $filters, $user, $global));
    }

    private function attachmentQuery(array $filters, ?User $user, bool $global): Builder
    {
        return Attachment::query()
            ->when($filters['forum_id'], fn ($q, $id) => $q->where('forum_id', $id))
            ->when($filters['period_id'], fn ($q, $id) => $q->whereHas('forum', fn ($f) => $f->where('forum_period_id', $id)))
            ->when(! $global && $user, fn ($q) => $q->whereHas('forum.participants', fn ($p) => $p->where('user_id', $user->id)->whereNull('removed_at')));
    }

    private function applyTopicFilters(Builder $query, array $filters, ?User $user, bool $global): void
    {
        $query->when($filters['forum_id'], fn ($q, $id) => $q->where('forum_id', $id))
            ->when($filters['period_id'], fn ($q, $id) => $q->whereHas('forum', fn ($f) => $f->where('forum_period_id', $id)))
            ->when(! $global && $user, fn ($q) => $q->whereHas('forum.participants', fn ($p) => $p->where('user_id', $user->id)->whereNull('removed_at')));
    }

    private function forumsPerRoom(array $filters, ?User $user, bool $global): array
    {
        return $this->periodQuery($filters, $user, $global)
            ->withCount(['forums as total_forum' => fn ($q) => $filters['forum_id'] ? $q->where('id', $filters['forum_id']) : $q])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (ForumPeriod $period) => [
                'room_id' => $period->id,
                'period_id' => $period->id,
                'room_name' => $period->name,
                'period_name' => $period->name,
                'total_forum' => (int) $period->total_forum,
            ])
            ->values()
            ->all();
    }

    private function discrepancyFormsPerForum(array $filters, ?User $user, bool $global): array
    {
        return $this->forumQuery($filters, $user, $global)
            ->with('period')
            ->withCount(['topics as total_discrepancy_forms' => fn ($q) => $filters['finding_type'] ? $q->whereHas('inputItems', fn ($i) => $i->where('type', $filters['finding_type'])->orWhere('metadata->finding_type', $filters['finding_type'])) : $q])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (Forum $forum) => [
                'forum_id' => $forum->id,
                'forum_name' => $forum->name,
                'room_id' => $forum->forum_period_id,
                'room_name' => $forum->period?->name ?: 'No Period',
                'forum_created_at' => optional($forum->created_at)->toISOString(),
                'total_discrepancy_forms' => (int) $forum->total_discrepancy_forms,
            ])
            ->values()
            ->all();
    }

    private function recentActivities(): array
    {
        return AuditLog::with('actor')->latest('timestamp')->limit(10)->get()->map(fn (AuditLog $log) => [
            'id' => $log->id,
            'type' => $log->action,
            'message' => str_replace('_', ' ', ucfirst($log->action)),
            'actor' => $log->actor ? (new UserResource($log->actor))->resolve(request()) : null,
            'created_at' => optional($log->timestamp ?: $log->created_at)->toISOString(),
        ])->values()->all();
    }

    private function summary(array $statistics): array
    {
        return [
            'total_users' => $statistics['users']['total'],
            'active_users' => $statistics['users']['active'],
            'inactive_users' => $statistics['users']['inactive'],
            'total_periods' => $statistics['periods']['total'],
            'total_rooms' => $statistics['periods']['total'],
            'total_forums' => $statistics['forums']['total'],
            'total_topics' => $statistics['topics']['total'],
            'total_input_items' => $statistics['input_items']['total'],
            'total_findings' => $statistics['input_items']['total_findings'],
            'total_attachments' => $statistics['attachments']['total'],
            'total_documents' => $statistics['documents']['total'],
            'total_clauses' => $statistics['clauses']['total'],
            'total_topic_document_masters' => $statistics['topic_document_masters']['total'],
        ];
    }

    private function cards(array $summary): array
    {
        return [
            ['key' => 'users', 'label' => 'Users', 'value' => $summary['total_users']],
            ['key' => 'periods', 'label' => 'Periods', 'value' => $summary['total_periods']],
            ['key' => 'forums', 'label' => 'Forums', 'value' => $summary['total_forums']],
            ['key' => 'topics', 'label' => 'Topics', 'value' => $summary['total_topics']],
            ['key' => 'findings', 'label' => 'Findings', 'value' => $summary['total_findings']],
            ['key' => 'documents', 'label' => 'Documents', 'value' => $summary['total_documents']],
        ];
    }

    private function charts(array $statistics): array
    {
        return [
            'topic_status' => collect(['draft', 'in_review', 'published', 'approved', 'changes_requested', 'closed', 'frozen'])->map(fn ($status) => ['key' => $status, 'label' => str_replace('_', ' ', $status), 'value' => $statistics['topics'][$status] ?? 0])->all(),
            'forum_status' => collect(['active', 'locked', 'archived'])->map(fn ($status) => ['key' => $status, 'label' => $status, 'value' => $statistics['forums'][$status] ?? 0])->all(),
            'user_roles' => collect($statistics['users']['by_role'])->map(fn ($value, $key) => ['key' => $key, 'label' => $key, 'value' => $value])->values()->all(),
            'recent_topics' => Topic::latest()->limit(10)->get(['id', 'title', 'status', 'created_at'])->map(fn (Topic $topic) => ['id' => $topic->id, 'title' => $topic->title, 'status' => $topic->status, 'created_at' => optional($topic->created_at)->toISOString()])->all(),
            'forums_per_room' => $statistics['forums_per_room'],
            'discrepancy_forms_per_forum' => $statistics['discrepancy_forms_per_forum'],
        ];
    }

    private function flatAliases(array $summary): array
    {
        return $summary + [
            'total_formulir' => $summary['total_topics'],
            'total_discrepancy_forms' => $summary['total_topics'],
        ];
    }

    private function status(string $status): string
    {
        return match ($status) {
            'request_changes', 'request-change', 'changes-requested' => 'changes_requested',
            'published' => 'in_review',
            'open' => 'draft',
            'done' => 'closed',
            default => $status,
        };
    }

    private function statusVariants(string $status): array
    {
        $normalized = $this->status($status);

        return $normalized === 'in_review' ? ['in_review', 'published'] : [$normalized];
    }

    private function myStatistics(?User $user): array
    {
        if (! $user) {
            return ['topics' => 0, 'forums' => 0, 'periods' => 0];
        }

        return [
            'topics' => Topic::where('created_by_user_id', $user->id)->count(),
            'forums' => ForumParticipant::active()->where('user_id', $user->id)->count(),
            'periods' => ForumPeriodMember::where('user_id', $user->id)->count(),
        ];
    }

    private function role(?User $user): ?string
    {
        return $user?->roles()->pluck('name')->first();
    }
}
