<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Topic\InputItemIndexRequest;
use App\Http\Requests\Api\V1\Content\Topic\InputItemStoreRequest;
use App\Http\Requests\Api\V1\Content\Topic\InputItemUpdateRequest;
use App\Services\Api\V1\Content\InputItemService;

class InputItemController extends BaseApiController
{
    public function __construct(private readonly InputItemService $items) {}
    public function index(string $topicId, InputItemIndexRequest $request) { return $this->items->index($topicId, $request); }
    public function store(string $topicId, InputItemStoreRequest $request) { return $this->items->store($topicId, $request->validated(), $request); }
    public function update(string $inputItemId, InputItemUpdateRequest $request) { return $this->items->update($inputItemId, $request->validated(), $request); }
}
