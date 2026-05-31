<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Retailer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $isUtcTeam = in_array($user->role, ['utc_team', 'admin']);

        $loansQuery = $isUtcTeam
            ? Loan::query()
            : Loan::where('agent_id', $user->id);

        $retailerQuery = $isUtcTeam
            ? Retailer::query()
            : Retailer::whereHas('agents', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            });

        $loans = $loansQuery->get();

        $stats = [
            'total_retailers'  => $retailerQuery->count(),
            'total_loans'      => $loans->count(),
            'pending_loans'    => $loans->where('status', 'Pending')->count(),
            'disbursed_loans'  => $loans->where('status', 'Disbursed')->count(),
            'closed_loans'     => $loans->where('status', 'Closed')->count(),
        ];

        if ($isUtcTeam) {
            $stats['total_agents'] = User::whereIn('role', ['agent', 'super_agent'])->count();
        }

        $recentLoans = (clone $loansQuery)
            ->latest()
            ->limit(5)
            ->get(['loan_code', 'customer_name', 'status', 'created_at', 'emi_amount']);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_loans' => $recentLoans,
            ]
        ]);
    }
}