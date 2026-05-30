<?php

namespace App\Services\Api\V1\User;

use App\Http\Resources\Api\V1\User\UserSearchResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSearchService
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $perPage = (int) $request->integer('per_page', 15);

        $query = User::query()
            ->with('roles', 'profile', 'contact', 'employment')
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status), fn ($query) => $query->where('status', 'active'))
            ->when($request->input('role'), function ($query, $role) {
                $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $role));
            })
            ->when($search, function ($query, $search) {
                $like = '%'.strtolower((string) $search).'%';
                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(username) LIKE ?', [$like])
                        ->orWhereHas('profile', fn ($profile) => $profile->whereRaw('LOWER(full_name) LIKE ?', [$like]))
                        ->orWhereHas('employment', function ($employment) use ($like) {
                            $employment->whereRaw('LOWER(employee_id) LIKE ?', [$like])
                                ->orWhereRaw('LOWER(department) LIKE ?', [$like])
                                ->orWhereRaw('LOWER(unit) LIKE ?', [$like]);
                        });
                });
            })
            ->orderBy('name');

        $paginator = $query->paginate($perPage);
        $items = collect($paginator->items())
            ->map(fn (User $user) => (new UserSearchResource($user))->resolve())
            ->values()
            ->all();

        $pagination = [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'path' => $paginator->path(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => [
                'users' => $items,
                'items' => $items,
                'data' => $items,
                ...$pagination,
            ],
            'users' => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }
}
