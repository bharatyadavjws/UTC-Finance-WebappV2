<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Retailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats(Request $request): JsonResponse
    {
        $agentId = $request->user()->id;

        // Count total retailers onboarded by this agent
        $totalRetailers = Retailer::where('agent_id', $agentId)->count();

        // Loan stats
        $loans = Loan::where('agent_id', $agentId)->get();
        
        $totalLoans = $loans->count();
        $pendingLoans = $loans->where('status', 'Pending')->count();
        $activeLoans = $loans->where('status', 'Active')->count();
        
        // Sum of all net disbursements for active/approved loans
        $totalDisbursed = $loans->whereIn('status', ['Active', 'Approved'])
                               ->sum('net_disbursement');

        // Get 5 most recent loan applications
        $recentLoans = Loan::where('agent_id', $agentId)
            ->latest()
            ->limit(5)
            ->get(['loan_code', 'customer_name', 'status', 'created_at', 'emi_amount']);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_retailers' => $totalRetailers,
                    'total_loans'     => $totalLoans,
                    'pending_loans'   => $pendingLoans,
                    'active_loans'    => $activeLoans,
                    'total_disbursed' => (float) $totalDisbursed,
                ],
                'recent_loans' => $recentLoans
            ]
        ]);
    }
}
