<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\InputItemResource;
use App\Models\Content\InputItem;
use App\Models\Content\Topic;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InputItemService
{
    public function __construct(private readonly TopicVersionService $versions, private readonly AuditLogService $audit) {}

    public function index(string $topicId, Request $request): JsonResponse
    {
        Topic::findOrFail($topicId);
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $query = InputItem::forTopic($topicId)->with(['creator', 'attachments'])
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($search, fn ($q) => $q->where(fn ($i) => $i->where('label', 'ilike', "%{$search}%")->orWhere('value', 'ilike', "%{$search}%")));
        $paginator = $query->orderBy('order_index')->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($item) => (new InputItemResource($item))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);
        return response()->json(['success' => true, 'message' => 'Input items retrieved successfully', 'data' => ['input_items' => $items, 'items' => $items], 'input_items' => $items, 'items' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function store(string $topicId, array $payload, Request $request): JsonResponse
    {
        $topic = Topic::findOrFail($topicId);
        $created = $this->createMany($topic, $payload['items'] ?? [$payload], $request);
        $this->versions->snapshot($topic->fresh(), 'Input item created', 'input_item_create', $request->user()?->id);
        $items = collect($created)->map(fn ($item) => (new InputItemResource($item->load('creator', 'attachments')))->resolve())->values()->all();
        $item = $items[0] ?? null;
        $this->audit->record($request->user(), 'topic', $topic->id, 'create_input_item', ['count' => count($items)], $request);
        return ApiResponse::success(['input_item' => $item, 'item' => $item, 'input_items' => $items, 'items' => $items], 'Input item saved successfully', 200, ['input_item' => $item, 'item' => $item]);
    }

    public function update(string $inputItemId, array $payload, Request $request): JsonResponse
    {
        $item = InputItem::with('topic')->findOrFail($inputItemId);
        $item->fill($this->normalize($payload, $item->topic, $item->order_index))->save();
        $this->versions->snapshot($item->topic->fresh(), 'Input item updated', 'input_item_update', $request->user()?->id);
        $this->audit->record($request->user(), 'input_item', $item->id, 'update_input_item', [], $request);
        $resource = (new InputItemResource($item->fresh(['creator', 'attachments'])))->resolve();
        return ApiResponse::success(['input_item' => $resource, 'item' => $resource], 'Input item saved successfully', 200, ['input_item' => $resource, 'item' => $resource]);
    }

    public function createMany(Topic $topic, array $items, Request $request): array
    {
        $created = [];
        foreach (array_values($items) as $index => $payload) {
            if (! is_array($payload)) continue;
            $created[] = InputItem::create($this->normalize($payload, $topic, $payload['order_index'] ?? $payload['sort_order'] ?? $index + 1) + ['topic_id' => $topic->id, 'created_by_user_id' => $request->user()?->id]);
        }
        return $created;
    }

    private function normalize(array $payload, Topic $topic, int $order): array
    {
        $metadata = $payload['metadata'] ?? [];
        foreach (['description', 'clause_id', 'clause_code', 'clause_name', 'recommendation', 'status'] as $key) {
            if (array_key_exists($key, $payload)) $metadata[$key] = $payload[$key];
        }
        return [
            'type' => $payload['type'] ?? 'finding',
            'label' => $payload['label'] ?? $payload['clause_name'] ?? $payload['clause_code'] ?? 'Item',
            'value' => is_array($payload['value'] ?? null) ? json_encode($payload['value']) : ($payload['value'] ?? $payload['content'] ?? $payload['description'] ?? ''),
            'metadata' => $metadata,
            'order_index' => $order,
            'visibility' => $payload['visibility'] ?? 'visible',
        ];
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
