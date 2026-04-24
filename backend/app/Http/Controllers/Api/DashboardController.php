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
        $isUtcTeam = $user->role === 'utc_team';

        // UTC Team sees ALL data globally, agents see only their own
        $loansQuery    = $isUtcTeam ? Loan::query()     : Loan::where('agent_id', $user->id);
        $retailerQuery = $isUtcTeam ? Retailer::query() : Retailer::where('agent_id', $user->id);

        $loans = $loansQuery->get();

        $stats = [
            'total_retailers' => $retailerQuery->count(),
            'total_loans'     => $loans->count(),
            'pending_loans'   => $loans->where('status', 'Pending')->count(),
            'active_loans'    => $loans->where('status', 'Active')->count(),
            'total_disbursed' => (float) $loans->whereIn('status', ['Active', 'Approved'])->sum('net_disbursement'),
        ];

        // UTC Team gets extra global stats
        if ($isUtcTeam) {
            $stats['total_agents'] = User::where('role', 'agent')->count();
        }

        $recentLoans = (clone $loansQuery)
            ->latest()
            ->limit(5)
            ->get(['loan_code', 'customer_name', 'status', 'created_at', 'emi_amount']);

        return response()->json([
            'success' => true,
            'data' => [
                'stats'        => $stats,
                'recent_loans' => $recentLoans,
            ]
        ]);
    }
}