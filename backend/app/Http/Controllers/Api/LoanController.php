<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LoanController extends Controller
{
    public function index(Request $request): JsonResponse
{
    $user      = $request->user();
    $isUtcTeam = $user->role === 'utc_team';

    $query = $isUtcTeam
        ? Loan::with(['agent', 'retailer', 'emiSchedules'])->latest()
        : Loan::with(['agent', 'retailer', 'emiSchedules'])->where('agent_id', $user->id)->latest();

    $loans = $query->get()->map(function ($loan) {
        return [
            'loan_code'           => $loan->loan_code,
            'status'              => $loan->status,
            'customer_name'       => $loan->customer_name,
            'customer_phone'      => $loan->customer_phone,
            'retailer_code'       => $loan->retailer_code,
            'retailer_name'       => $loan->retailer?->shop_name ?? '-',
            'agent_name'          => $loan->agent?->name ?? '-',
            'item_name'           => $loan->item_name,
            'item_value'          => $loan->item_value,
            'device_type'         => $loan->device_type,
            'plan_label'          => $loan->plan_label,
            'plan_months'         => $loan->plan_months,
            'loan_amount'         => $loan->loan_amount,
            'net_disbursement'    => $loan->net_disbursement,
            'emi_amount'          => $loan->emi_amount,
            'down_payment'        => $loan->down_payment,
            'first_emi_date'      => $loan->first_emi_date,
            'last_repayment_date' => $loan->last_repayment_date,
            'created_at'          => $loan->created_at?->format('d M Y'),
            'total_repaid'        => $loan->emiSchedules->where('status', 'paid')->sum('amount'),
        ];
    });

    return response()->json([
        'success' => true,
        'message' => 'Loans fetched successfully',
        'data'    => $loans,
    ]);
}

    public function show(Request $request, string $loanCode): JsonResponse
    {
        $user      = $request->user();
        $isUtcTeam = $user->role === 'utc_team';

        $query = Loan::with(['agent', 'retailer'])->where('loan_code', $loanCode);

        // UTC Team can view any loan, agents only their own
        if (!$isUtcTeam) {
            $query->where('agent_id', $user->id);
        }

        $loan = $query->first();

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Loan not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => array_merge($loan->toArray(), [
                'agent_name'    => $loan->agent?->name ?? '-',
                'retailer_name' => $loan->retailer?->shop_name ?? '-',
            ])
        ]);
    }

    public function updateStatus(Request $request, string $loanCode): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:Pending,Approved,Disbursed,Active,Rejected,Cancelled,Closed,Blocked'
        ]);

        $loan = Loan::where('loan_code', $loanCode)->first();

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Loan not found'
            ], 404);
        }

        $loan->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => "Loan status updated to {$request->status}",
            'data'    => [
                'loan_code' => $loan->loan_code,
                'status'    => $loan->status,
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'retailer_code'  => 'required|string|exists:retailers,retailer_code',
            'customer_name'  => 'required|string|max:150',
            'customer_phone' => 'required|string|max:15',
            'customer_dob'   => 'nullable|date',
            'plan_key'       => 'required|string',
            'loan_amount'    => 'required|numeric|min:1',
            'emi_amount'     => 'required|numeric|min:1',
        ]);

        $loanCode = Loan::generateLoanCode();

        $loan = Loan::create([
            'loan_code'               => $loanCode,
            'agent_id'                => $request->user()->id,
            'retailer_code'           => $request->retailer_code,
            'customer_name'           => $request->customer_name,
            'customer_phone'          => $request->customer_phone,
            'customer_email'          => $request->customer_email,
            'customer_dob'            => $request->customer_dob,
            'customer_monthly_salary' => $request->customer_monthly_salary,
            'customer_address'        => $request->customer_address,
            'customer_photo'          => $this->storeFile($request, 'customer_photo', 'loans/customer_photos'),
            'aadhar_number'           => $request->aadhar_number,
            'aadhar_front'            => $this->storeFile($request, 'aadhar_front', 'loans/kyc'),
            'aadhar_back'             => $this->storeFile($request, 'aadhar_back',  'loans/kyc'),
            'pan_number'              => $request->pan_number,
            'pan_photo'               => $this->storeFile($request, 'pan_photo', 'loans/kyc'),
            'account_number'          => $request->account_number,
            'ifsc_code'               => $request->ifsc_code,
            'item_name'               => $request->item_name,
            'item_value'              => $request->item_value,
            'item_imei'               => $request->item_imei,
            'item_photo'              => $this->storeFile($request, 'item_photo', 'loans/devices'),
            'device_type'             => $request->device_type ?? 'ANDROID',
            'down_payment'            => $request->down_payment,
            'cibil_score'             => $request->cibil_score,
            'current_emi'             => $request->current_emi,
            'plan_key'                => $request->plan_key,
            'plan_label'              => $request->plan_label,
            'plan_months'             => $request->plan_months,
            'loan_amount'             => $request->loan_amount,
            'net_disbursement'        => $request->net_disbursement,
            'emi_amount'              => $request->emi_amount,
            'processing_fee'          => $request->processing_fee,
            'total_repay'             => $request->total_repay,
            'interest_amount'         => $request->interest_amount,
            'av_fee'                  => $request->av_fee,
            'app_lock_fee'            => $request->app_lock_fee,
            'total_charges'           => $request->total_charges,
            'first_emi_date'          => $request->first_emi_date,
            'last_repayment_date'     => $request->last_repayment_date,
            'tenure_days'             => $request->tenure_days,
            'status'                  => 'Pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Loan created successfully',
            'data'    => [
                'loan_id'   => $loan->loan_code,
                'loan_code' => $loan->loan_code,
                'status'    => $loan->status,
            ],
        ], 201);
    }

    private function storeFile(Request $request, string $field, string $path): ?string
    {
        if (!$request->hasFile($field)) return null;
        $file = $request->file($field);
        if (!$file->isValid()) return null;
        return $file->store($path, 'public');
    }

    public function markAsDisbursed($id)
{
    $loan = Loan::findOrFail($id);

    if ($loan->status !== 'approved') {
        return response()->json(['message' => 'Only approved loans can be disbursed.'], 422);
    }

    $commissionRate = 0.02; // 2% — adjust as needed
    $loan->status = 'disbursed';
    $loan->commission_amount = $loan->loan_amount * $commissionRate;
    $loan->commission_status = 'unpaid';
    $loan->disbursed_at = now();
    $loan->save();

    return response()->json(['message' => 'Loan marked as disbursed successfully.']);
}
public function crmIndex(Request $request)
{
    $query = Loan::with(['agent.user', 'retailer']);

    if ($request->has('status')) {
        $query->where('status', $request->status);
    }

    $loans = $query->latest()->get()->map(function ($loan) {
        return [
            'id'            => $loan->id,
            'loan_number'   => $loan->loan_code,
            'customer_name' => $loan->customer_name,
            'agent_name'    => optional(optional($loan->agent)->user)->name,
            'retailer_name' => optional($loan->retailer)->shop_name,
            'loan_amount'   => $loan->loan_amount,
            'status'        => $loan->status,
            'created_at'    => $loan->created_at,
        ];
    });

    return response()->json(['data' => $loans]);
}
}