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
    public function index(Request $request): JsonResponse
    {
        $query = Retailer::query()->latest();

        $agentId = $request->user()->id;
        $query->where('agent_id', $agentId);

        $retailers = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Retailers fetched successfully',
            'data' => RetailerResource::collection($retailers),
        ], 200);
    }

    public function store(StoreRetailerRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $retailer = Retailer::create([
            ...$validated,
            'agent_id' => $request->user()?->id ?? 1,
            'retailer_code' => $this->generateRetailerCode(),
            'status' => 'Active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Retailer created successfully',
            'data' => new RetailerResource($retailer),
        ], 201);
    }

    public function show(Retailer $retailer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Retailer details fetched successfully',
            'data' => new RetailerResource($retailer),
        ], 200);
    }

    public function update(UpdateRetailerRequest $request, Retailer $retailer): JsonResponse
    {
        $retailer->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Retailer updated successfully',
            'data' => new RetailerResource($retailer->fresh()),
        ], 200);
    }

    public function updateStatus(UpdateRetailerStatusRequest $request, Retailer $retailer): JsonResponse
    {
        $retailer->update([
            'status' => $request->validated()['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Retailer status updated successfully',
            'data' => new RetailerResource($retailer->fresh()),
        ], 200);
    }

    private function generateRetailerCode(): string
    {
        do {
            $code = 'RET' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Retailer::where('retailer_code', $code)->exists());

        return $code;
    }
}