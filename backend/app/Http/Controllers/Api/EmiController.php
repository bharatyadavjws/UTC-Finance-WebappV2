<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmiSchedule;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmiController extends Controller
{
    // GET /api/emis — all EMIs across all loans (UTC Team global view)
    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $isUtcTeam = $user->role === 'utc_team';

        $query = EmiSchedule::with(['loan' => function ($q) {
            $q->select('loan_code', 'customer_name', 'customer_phone', 'agent_id', 'retailer_code')
              ->with(['agent:id,name', 'retailer:retailer_code,shop_name']);
        }])->orderBy('due_date', 'asc');

        // Agents only see their own loans' EMIs
        if (!$isUtcTeam) {
            $loanCodes = Loan::where('agent_id', $user->id)->pluck('loan_code');
            $query->whereIn('loan_code', $loanCodes);
        }

        // Filters
        if ($request->status)    $query->where('status', $request->status);
        if ($request->loan_code) $query->where('loan_code', $request->loan_code);
        if ($request->from_date) $query->whereDate('due_date', '>=', $request->from_date);
        if ($request->to_date)   $query->whereDate('due_date', '<=', $request->to_date);

        $emis = $query->get()->map(fn($e) => [
            'id'                 => $e->id,
            'loan_code'          => $e->loan_code,
            'customer_name'      => $e->loan?->customer_name ?? '—',
            'customer_phone'     => $e->loan?->customer_phone ?? '—',
            'agent_name'         => $e->loan?->agent?->name ?? '—',
            'retailer_name'      => $e->loan?->retailer?->shop_name ?? '—',
            'installment_number' => $e->installment_number,
            'due_date'           => $e->due_date?->format('d M Y'),
            'due_date_raw'       => $e->due_date?->format('Y-m-d'),
            'amount'             => $e->amount,
            'status'             => $e->status,
            'paid_at'            => $e->paid_at?->format('d M Y'),
        ]);

        // Summary counts
        $summary = [
            'total'   => $emis->count(),
            'pending' => $emis->where('status', 'pending')->count(),
            'paid'    => $emis->where('status', 'paid')->count(),
            'overdue' => $emis->where('status', 'overdue')->count(),
            'total_pending_amount' => $emis->whereIn('status', ['pending', 'overdue'])->sum('amount'),
            'total_collected'      => $emis->where('status', 'paid')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data'    => ['summary' => $summary, 'emis' => $emis],
        ]);
    }

    // PATCH /api/emis/{id}/status — mark EMI as paid/overdue
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status'            => 'required|in:pending,paid,overdue',
            'paid_at'           => 'nullable|date',
            'payment_reference' => 'nullable|string|max:100',
            'note'              => 'nullable|string',
        ]);

        $emi = EmiSchedule::findOrFail($id);
        $emi->update([
            'status'            => $request->status,
            'paid_at'           => $request->status === 'paid' ? ($request->paid_at ?? now()->toDateString()) : null,
            'payment_reference' => $request->payment_reference,
            'note'              => $request->note,
        ]);

        return response()->json([
            'success' => true,
            'message' => "EMI marked as {$request->status}",
            'data'    => $emi,
        ]);
    }

    // POST /api/loans/{loanCode}/generate-emis — generate schedule for a loan
    public function generate(Request $request, string $loanCode): JsonResponse
    {
        $loan = Loan::where('loan_code', $loanCode)->firstOrFail();

        // Don't regenerate if already exists
        if (EmiSchedule::where('loan_code', $loanCode)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'EMI schedule already generated for this loan',
            ], 422);
        }

        if (!$loan->plan_months || !$loan->emi_amount || !$loan->first_emi_date) {
            return response()->json([
                'success' => false,
                'message' => 'Loan is missing plan_months, emi_amount, or first_emi_date',
            ], 422);
        }

        $schedules = [];
        $dueDate   = \Carbon\Carbon::parse($loan->first_emi_date);
        $principal = (float) $loan->loan_amount;
        $emi       = (float) $loan->emi_amount;
        $months    = (int)   $loan->plan_months;
        $rate      = $months > 0 ? (($emi * $months - $principal) / $principal / $months) : 0;
        $balance   = $principal;

        for ($i = 1; $i <= $months; $i++) {
            $interest     = round($balance * $rate, 2);
            $principalPart = round($emi - $interest, 2);
            $balance      -= $principalPart;

            $schedules[] = [
                'loan_code'          => $loanCode,
                'installment_number' => $i,
                'due_date'           => $dueDate->format('Y-m-d'),
                'amount'             => $emi,
                'principal'          => max(0, $principalPart),
                'interest'           => max(0, $interest),
                'status'             => 'pending',
                'created_at'         => now(),
                'updated_at'         => now(),
            ];

            $dueDate->addMonth();
        }

        EmiSchedule::insert($schedules);

        return response()->json([
            'success' => true,
            'message' => "{$months} EMI installments generated",
            'data'    => ['count' => $months],
        ]);
    }
}