<?php

namespace App\Services\Api\V1\Admin\System;

use App\Http\Resources\Api\V1\Admin\System\ClauseResource;
use App\Models\System\Clause;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminClauseService
{
    public function index(Request $request): JsonResponse { $s=$request->input('search')?:$request->input('q')?:$request->input('keyword'); $q=Clause::query()->when($s,fn($q)=>$q->where(fn($i)=>$i->where('code','ilike',"%$s%")->orWhere('name','ilike',"%$s%")->orWhere('description','ilike',"%$s%")))->when($request->has('is_active'),fn($q)=>$q->where('is_active',$request->boolean('is_active'))); $p=$q->orderBy('code')->paginate((int)$request->integer('per_page',15)); $items=collect($p->items())->map(fn($c)=>(new ClauseResource($c))->resolve())->values()->all(); $pg=$this->pagination($p); return response()->json(['success'=>true,'message'=>'Clauses retrieved successfully','data'=>['clauses'=>$items,'items'=>$items,'data'=>$items,...$pg],'clauses'=>$items,'items'=>$items,'meta'=>$pg,'pagination'=>$pg]); }
    public function store(array $p, Request $r): JsonResponse { $c=Clause::create(['code'=>$p['code'],'name'=>$p['name'],'description'=>$p['description']??null,'is_active'=>$p['is_active']??true,'created_by_user_id'=>$r->user()?->id,'updated_by_user_id'=>$r->user()?->id]); return $this->one($c,'Clause saved successfully'); }
    public function update(string $id, array $p, Request $r): JsonResponse { $c=Clause::findOrFail($id); $c->fill(array_filter(['code'=>$p['code']??null,'name'=>$p['name']??null,'description'=>$p['description']??null,'is_active'=>$p['is_active']??null,'updated_by_user_id'=>$r->user()?->id],fn($v)=>$v!==null))->save(); return $this->one($c,'Clause saved successfully'); }
    public function destroy(string $id): JsonResponse { $c=Clause::findOrFail($id); $c->delete(); return ApiResponse::success([], 'Clause deleted successfully'); }
    private function one(Clause $c,string $m): JsonResponse { $payload=(new ClauseResource($c))->resolve(); return ApiResponse::success(['clause'=>$payload],$m,200,['clause'=>$payload]); }
    private function pagination($p): array { return ['current_page'=>$p->currentPage(),'per_page'=>$p->perPage(),'total'=>$p->total(),'last_page'=>$p->lastPage(),'from'=>$p->firstItem(),'to'=>$p->lastItem()]; }
}
