<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRetailerRequest;
use App\Http\Requests\Api\UpdateRetailerRequest;
use App\Http\Requests\Api\UpdateRetailerStatusRequest;
use App\Http\Resources\RetailerResource;
use App\Models\Retailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RetailerController extends Controller
{
    /**
     * GET /api/retailers
     * - utc_team / admin: all retailers
     * - agent: only retailers assigned to them
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Retailer::query()->with('agents')->latest();

        if ($user->role === 'agent') {
            $query->whereHas('agents', fn($q) => $q->where('users.id', $user->id));
        }

        return response()->json([
            'success' => true,
            'message' => 'Retailers fetched successfully',
            'data'    => RetailerResource::collection($query->get()),
        ]);
    }

    /**
     * POST /api/retailers
     * Only CRM roles (utc_team, admin) can create
     */
    public function store(StoreRetailerRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'agent') {
            return response()->json([
                'success' => false,
                'message' => 'Agents are not allowed to create retailers.',
            ], 403);
        }

        $retailer = Retailer::create([
            ...$request->validated(),
            'retailer_code' => $this->generateRetailerCode(),
            'status'        => 'Active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Retailer created successfully',
            'data'    => new RetailerResource($retailer->load('agents')),
        ], 201);
    }

    /**
     * GET /api/retailers/{retailer}
     */
    public function show(Retailer $retailer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Retailer details fetched successfully',
            'data'    => new RetailerResource($retailer->load('agents')),
        ]);
    }

    /**
     * PUT /api/retailers/{retailer}
     */
    public function update(UpdateRetailerRequest $request, Retailer $retailer): JsonResponse
    {
        $retailer->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Retailer updated successfully',
            'data'    => new RetailerResource($retailer->fresh('agents')),
        ]);
    }

    /**
     * PATCH /api/retailers/{retailer}/status
     */
    public function updateStatus(UpdateRetailerStatusRequest $request, Retailer $retailer): JsonResponse
    {
        $retailer->update(['status' => $request->validated()['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Retailer status updated successfully',
            'data'    => new RetailerResource($retailer->fresh('agents')),
        ]);
    }

    /**
     * POST /api/retailers/{retailer}/assign
     * Body: { agent_ids: [1, 2, 3] }  — replaces all current assignments
     */
    public function assign(Request $request, Retailer $retailer): JsonResponse
    {
        $request->validate([
            'agent_ids'   => 'required|array',
            'agent_ids.*' => 'integer|exists:users,id',
        ]);

        $retailer->agents()->sync($request->agent_ids);

        return response()->json([
            'success' => true,
            'message' => 'Retailer agents updated successfully',
            'data'    => new RetailerResource($retailer->fresh('agents')),
        ]);
    }

    /**
     * DELETE /api/retailers/{retailer}/assign/{agent}
     * Remove a single agent from a retailer
     */
    public function unassign(Retailer $retailer, int $agentId): JsonResponse
    {
        $retailer->agents()->detach($agentId);

        return response()->json([
            'success' => true,
            'message' => 'Agent removed from retailer',
            'data'    => new RetailerResource($retailer->fresh('agents')),
        ]);
    }

    private function generateRetailerCode(): string
    {
        do {
            $code = 'RET' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Retailer::where('retailer_code', $code)->exists());

        return $code;
    }
}