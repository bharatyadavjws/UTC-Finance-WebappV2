<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index()
    {
        $loans = Loan::with(['agent.user', 'retailer'])
            ->whereIn('status', ['disbursed', 'active', 'completed', 'overdue'])
            ->get()
            ->map(function ($loan) {
                return [
                    'id'                => $loan->id,
                    'loan_number'       => $loan->loan_number,
                    'agent_name'        => optional(optional($loan->agent)->user)->name,
                    'retailer_name'     => optional($loan->retailer)->shop_name,
                    'loan_amount'       => $loan->loan_amount,
                    'commission_amount' => $loan->commission_amount,
                    'commission_status' => $loan->commission_status,
                    'disbursed_at'      => $loan->disbursed_at,
                ];
            });

        return response()->json(['data' => $loans]);
    }

    public function markPaid($id)
    {
        $loan = Loan::findOrFail($id);
        $loan->commission_status = 'paid';
        $loan->save();

        return response()->json(['message' => 'Commission marked as paid.']);
    }
}