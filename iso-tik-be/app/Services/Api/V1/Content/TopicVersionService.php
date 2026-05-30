<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\TopicVersionResource;
use App\Models\Content\Topic;
use App\Models\Content\TopicVersion;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicVersionService
{
    public function snapshot(Topic $topic, ?string $reason, string $type, ?string $userId): TopicVersion
    {
        $topic->load('inputItems');
        $number = ((int) TopicVersion::forTopic($topic->id)->max('version_number')) + 1;
        return TopicVersion::create([
            'topic_id' => $topic->id,
            'version_number' => $number,
            'title' => $topic->title,
            'description' => $topic->description,
            'status' => $topic->status,
            'snapshot_data' => [
                'topic' => $topic->only(['forum_id', 'document_master_id', 'title', 'description', 'status', 'version_major', 'version_minor', 'deadline_at', 'is_frozen', 'frozen_until']),
                'input_items' => $topic->inputItems->map(fn ($item) => $item->only(['id', 'type', 'label', 'value', 'metadata', 'order_index', 'visibility']))->values()->all(),
            ],
            'changed_by_user_id' => $userId,
            'change_reason' => $reason,
            'change_type' => $this->type($type),
        ]);
    }

    public function index(string $topicId, Request $request): JsonResponse
    {
        Topic::findOrFail($topicId);
        $paginator = TopicVersion::forTopic($topicId)->with('changedBy')->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($version) => (new TopicVersionResource($version))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);
        return response()->json(['success' => true, 'message' => 'Topic versions retrieved successfully', 'data' => ['versions' => $items, 'items' => $items], 'versions' => $items, 'items' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function revert(string $topicId, string $versionId, Request $request): JsonResponse
    {
        $topic = Topic::findOrFail($topicId);
        $version = TopicVersion::forTopic($topicId)->findOrFail($versionId);
        $snapshot = $version->snapshot_data ?: [];
        $topicData = $snapshot['topic'] ?? [];
        $topic->fill(collect($topicData)->only(['title', 'description', 'status', 'document_master_id', 'deadline_at', 'is_frozen', 'frozen_until'])->all())->save();
        $newVersion = $this->snapshot($topic->fresh(), $request->input('reason', 'Reverted version '.$version->version_number), 'revert', $request->user()?->id);
        $topicPayload = app(TopicService::class)->payload($topic->fresh(), $request, true);
        $versionPayload = (new TopicVersionResource($newVersion))->resolve();
        return ApiResponse::success(['topic' => $topicPayload, 'version' => $versionPayload], 'Topic version reverted successfully', 200, ['topic' => $topicPayload, 'version' => $versionPayload]);
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }

    private function type(string $type): string
    {
        return in_array($type, ['create', 'update', 'workflow', 'revert'], true)
            ? $type
            : (str_contains($type, 'input_item') ? 'update' : 'workflow');
    }
}
