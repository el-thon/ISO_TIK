<?php

namespace App\Services\Api\V1\Admin\Content;

use App\Http\Resources\Api\V1\Admin\Content\TopicDocumentMasterResource;
use App\Models\Content\TopicDocumentMaster;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicDocumentMasterService
{
    public function index(Request $request): JsonResponse { $s=$request->input('search')?:$request->input('q')?:$request->input('keyword'); $q=TopicDocumentMaster::query()->when($s,fn($q)=>$q->where(fn($i)=>$i->where('document_number','ilike',"%$s%")->orWhere('revision_number','ilike',"%$s%")))->when($request->has('is_active'),fn($q)=>$q->where('is_active',$request->boolean('is_active'))); $p=$q->orderByDesc('created_at')->paginate((int)$request->integer('per_page',15)); $items=collect($p->items())->map(fn($m)=>(new TopicDocumentMasterResource($m))->resolve())->values()->all(); $pg=$this->pagination($p); return response()->json(['success'=>true,'message'=>'Topic document masters retrieved successfully','data'=>$items,'topic_document_masters'=>$items,'masters'=>$items,'items'=>$items,'meta'=>$pg,'pagination'=>$pg]); }
    public function store(array $p): JsonResponse { if($p['is_active']??false) TopicDocumentMaster::where('is_active',true)->update(['is_active'=>false]); $m=TopicDocumentMaster::create(['document_number'=>$p['document_number'],'revision_number'=>$p['revision_number']??null,'published_at'=>$p['published_at']??null,'is_active'=>$p['is_active']??false]); return $this->one($m,'Topic document master saved successfully'); }
    public function update(string $id,array $p): JsonResponse { $m=TopicDocumentMaster::findOrFail($id); if(array_key_exists('is_active',$p)&&$p['is_active']) TopicDocumentMaster::where('id','!=',$id)->update(['is_active'=>false]); $m->fill(array_filter(['document_number'=>$p['document_number']??null,'revision_number'=>$p['revision_number']??null,'published_at'=>$p['published_at']??null,'is_active'=>$p['is_active']??null],fn($v)=>$v!==null))->save(); return $this->one($m,'Topic document master saved successfully'); }
    public function destroy(string $id): JsonResponse { $m=TopicDocumentMaster::findOrFail($id); $m->delete(); return ApiResponse::success([], 'Topic document master deleted successfully'); }
    public function active(): JsonResponse { $m=TopicDocumentMaster::active()->latest()->first(); if(!$m) return ApiResponse::notFound('Active topic document master not found'); $payload=(new TopicDocumentMasterResource($m))->resolve(); return ApiResponse::success($payload,'Active topic document master retrieved successfully',200,['topic_document_master'=>$payload,'master'=>$payload]); }
    private function one(TopicDocumentMaster $m,string $msg): JsonResponse { $p=(new TopicDocumentMasterResource($m))->resolve(); return ApiResponse::success(['topic_document_master'=>$p,'master'=>$p],$msg,200,['topic_document_master'=>$p,'master'=>$p]); }
    private function pagination($p): array { return ['current_page'=>$p->currentPage(),'per_page'=>$p->perPage(),'total'=>$p->total(),'last_page'=>$p->lastPage(),'from'=>$p->firstItem(),'to'=>$p->lastItem()]; }
}
