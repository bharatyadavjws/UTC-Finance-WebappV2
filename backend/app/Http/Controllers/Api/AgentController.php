<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Retailer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AgentController extends Controller
{
    // List all agents with their stats
    public function index(): JsonResponse
    {
        $agents = User::where('role', 'agent')
            ->latest()
            ->get()
            ->map(function ($agent) {
                return [
                    'id'              => $agent->id,
                    'name'            => $agent->name,
                    'email'           => $agent->email,
                    'role'            => $agent->role,
                    'total_retailers' => Retailer::where('agent_id', $agent->id)->count(),
                    'total_loans'     => Loan::where('agent_id', $agent->id)->count(),
                    'active_loans'    => Loan::where('agent_id', $agent->id)->where('status', 'Active')->count(),
                    'pending_loans'   => Loan::where('agent_id', $agent->id)->where('status', 'Pending')->count(),
                    'joined_at'       => $agent->created_at?->format('d M Y'),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $agents,
        ]);
    }

    // Create a new agent
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', Password::min(8)],
        ]);

        $agent = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'agent',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Agent created successfully',
            'data'    => [
                'id'    => $agent->id,
                'name'  => $agent->name,
                'email' => $agent->email,
                'role'  => $agent->role,
            ],
        ], 201);
    }

    // Get single agent with their retailers and recent loans
    public function show(User $user): JsonResponse
    {
        if ($user->role !== 'agent') {
            return response()->json(['success' => false, 'message' => 'User is not an agent'], 404);
        }

        $retailers = Retailer::where('agent_id', $user->id)
            ->get(['retailer_code', 'shop_name', 'owner_name', 'mobile', 'city', 'status']);

        $recentLoans = Loan::where('agent_id', $user->id)
            ->latest()
            ->limit(10)
            ->get(['loan_code', 'customer_name', 'loan_amount', 'status', 'created_at']);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'joined_at'    => $user->created_at?->format('d M Y'),
                'total_retailers' => $retailers->count(),
                'total_loans'     => Loan::where('agent_id', $user->id)->count(),
                'retailers'    => $retailers,
                'recent_loans' => $recentLoans,
            ],
        ]);
    }
}