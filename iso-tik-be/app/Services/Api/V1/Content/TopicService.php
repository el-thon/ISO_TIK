<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\TopicDetailResource;
use App\Http\Resources\Api\V1\Content\TopicResource;
use App\Models\Collaboration\Forum;
use App\Models\Content\Topic;
use App\Models\Content\TopicDocumentMaster;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class TopicService
{
    public function __construct(private readonly TopicVersionService $versions, private readonly AuditLogService $audit) {}

    public function index(Request $request, ?string $forumId = null): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $query = Topic::query()->with(['forum.period', 'forum.participants', 'creator', 'documentMaster', 'workflowStates'])->withCount(['inputItems', 'versions'])
            ->when($forumId ?: $request->input('forum_id'), fn ($q, $id) => $q->where('forum_id', $id))
            ->when($request->input('period_id'), fn ($q, $id) => $q->whereHas('forum', fn ($f) => $f->where('forum_period_id', $id)))
            ->when($request->input('status') ?: $request->input('workflow_status'), fn ($q, $status) => $q->whereIn('status', $this->statusVariants($status)))
            ->when($request->boolean('created_by_me') || $request->boolean('mine'), fn ($q) => $q->where('created_by_user_id', $request->user()->id))
            ->when($request->input('created_by'), fn ($q, $id) => $q->where('created_by_user_id', $id))
            ->when($request->boolean('assigned') || $request->boolean('assigned_to_me'), fn ($q) => $q->whereHas('forum.participants', fn ($p) => $p->where('user_id', $request->user()->id)->whereNull('removed_at')))
            ->when($search, fn ($q) => $q->where(fn ($i) => $i->where('title', 'ilike', "%{$search}%")->orWhere('description', 'ilike', "%{$search}%")));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($topic) => (new TopicResource($topic))->resolve($request))->values()->all();
        $pagination = $this->pagination($paginator);
        return response()->json(['success' => true, 'message' => 'Topics retrieved successfully', 'data' => ['topics' => $items, 'items' => $items, 'results' => $items, 'list' => $items], 'topics' => $items, 'items' => $items, 'results' => $items, 'list' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function store(string $forumId, array $payload, Request $request): JsonResponse
    {
        Forum::findOrFail($forumId);
        $masterId = $payload['topic_document_master_id'] ?? $payload['document_master_id'] ?? TopicDocumentMaster::active()->latest()->first()?->id;
        $topic = Topic::create([
            'forum_id' => $forumId,
            'document_master_id' => $masterId,
            'title' => $payload['title'] ?? $payload['name'] ?? 'Untitled topic',
            'description' => $payload['description'] ?? null,
            'status' => $this->status($payload['status'] ?? 'draft'),
            'version_major' => 1,
            'version_minor' => 0,
            'is_frozen' => false,
            'created_by_user_id' => $request->user()?->id,
        ]);
        app(InputItemService::class)->createMany($topic, $this->itemsFromTopicPayload($payload), $request);
        $this->versions->snapshot($topic, 'Initial topic', 'create', $request->user()?->id);
        $this->audit->record($request->user(), 'topic', $topic->id, 'create_topic', [], $request);
        return $this->topicResponse($topic, 'Topic created successfully', $request);
    }

    public function show(string $topicId, Request $request): JsonResponse
    {
        return $this->topicResponse(Topic::withTrashed()->findOrFail($topicId), 'Topic retrieved successfully', $request);
    }

    public function topicResponse(Topic $topic, string $message, Request $request): JsonResponse
    {
        $payload = $this->payload($topic, $request, true);
        return ApiResponse::success(['topic' => $payload, 'input_items' => $payload['input_items'] ?? [], 'items' => $payload['items'] ?? [], 'workflow' => $payload['workflow'] ?? [], 'participants' => $payload['participants'] ?? [], 'versions' => $payload['versions'] ?? []], $message, 200, ['topic' => $payload, 'input_items' => $payload['input_items'] ?? [], 'items' => $payload['items'] ?? [], 'workflow' => $payload['workflow'] ?? [], 'participants' => $payload['participants'] ?? [], 'versions' => $payload['versions'] ?? []]);
    }

    public function payload(Topic $topic, Request $request, bool $detail = false): array
    {
        $relations = ['forum.period', 'forum.participants.user', 'creator', 'documentMaster', 'workflowStates.changedBy'];
        if ($detail) $relations = array_merge($relations, ['inputItems.creator', 'inputItems.attachments', 'versions.changedBy']);
        $topic->load($relations)->loadCount(['inputItems', 'versions']);
        return ($detail ? new TopicDetailResource($topic) : new TopicResource($topic))->resolve($request);
    }

    public function status(string $status): string
    {
        return match ($status) {
            'request_changes', 'request-change', 'changes-requested' => 'changes_requested',
            'published' => 'in_review',
            'open' => 'draft',
            'done' => 'closed',
            default => $status,
        };
    }

    public function statusVariants(string $status): array
    {
        $normalized = $this->status($status);

        return $normalized === 'in_review' ? ['in_review', 'published'] : [$normalized];
    }

    private function itemsFromTopicPayload(array $payload): array
    {
        return $payload['input_items'] ?? $payload['items'] ?? $payload['findings'] ?? [];
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
