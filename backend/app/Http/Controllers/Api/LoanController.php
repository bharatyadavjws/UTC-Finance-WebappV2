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
        $agentId = $request->user()->id;

        $loans = Loan::where('agent_id', $agentId)
            ->latest()
            ->get()
            ->map(function ($loan) {
                return [
                    'loan_code'        => $loan->loan_code,
                    'status'           => $loan->status,
                    'customer_name'    => $loan->customer_name,
                    'customer_phone'   => $loan->customer_phone,
                    'retailer_code'    => $loan->retailer_code,
                    'item_name'        => $loan->item_name,
                    'item_value'       => $loan->item_value,
                    'device_type'      => $loan->device_type,
                    'plan_label'       => $loan->plan_label,
                    'plan_months'      => $loan->plan_months,
                    'loan_amount'      => $loan->loan_amount,
                    'net_disbursement' => $loan->net_disbursement,
                    'emi_amount'       => $loan->emi_amount,
                    'down_payment'     => $loan->down_payment,
                    'first_emi_date'   => $loan->first_emi_date,
                    'last_repayment_date' => $loan->last_repayment_date,
                    'created_at'       => $loan->created_at?->format('d M Y'),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Loans fetched successfully',
            'data'    => $loans,
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

        $customerPhoto = $this->storeFile($request, 'customer_photo', 'loans/customer_photos');
        $aadharFront   = $this->storeFile($request, 'aadhar_front',   'loans/kyc');
        $aadharBack    = $this->storeFile($request, 'aadhar_back',    'loans/kyc');
        $panPhoto      = $this->storeFile($request, 'pan_photo',      'loans/kyc');
        $itemPhoto     = $this->storeFile($request, 'item_photo',     'loans/devices');

        $loanCode = Loan::generateLoanCode();

        $loan = Loan::create([
            'loan_code'               => $loanCode,
            'agent_id'                => $request->user()?->id ?? 1,
            'retailer_code'           => $request->retailer_code,
            'customer_name'           => $request->customer_name,
            'customer_phone'          => $request->customer_phone,
            'customer_email'          => $request->customer_email,
            'customer_dob'            => $request->customer_dob,
            'customer_monthly_salary' => $request->customer_monthly_salary,
            'customer_address'        => $request->customer_address,
            'customer_photo'          => $customerPhoto,
            'aadhar_number'           => $request->aadhar_number,
            'aadhar_front'            => $aadharFront,
            'aadhar_back'             => $aadharBack,
            'pan_number'              => $request->pan_number,
            'pan_photo'               => $panPhoto,
            'account_number'          => $request->account_number,
            'ifsc_code'               => $request->ifsc_code,
            'item_name'               => $request->item_name,
            'item_value'              => $request->item_value,
            'item_imei'               => $request->item_imei,
            'item_photo'              => $itemPhoto,
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

    public function show(Request $request, string $loanCode): JsonResponse
{
    $agentId = $request->user()->id;

    $loan = Loan::where('agent_id', $agentId)
        ->where('loan_code', $loanCode)
        ->first();

    if (!$loan) {
        return response()->json([
            'success' => false,
            'message' => 'Loan not found'
        ], 404);
    }

    return response()->json([
        'success' => true,
        'data' => $loan
    ]);
}
public function updateStatus(Request $request, string $loanCode): JsonResponse
{
    // In production, we would check if the user has 'utc_team' or 'admin' role here
    $request->validate([
        'status' => 'required|string|in:Pending,Approved,Active,Rejected,Cancelled,Closed,Blocked'
    ]);

    $loan = Loan::where('loan_code', $loanCode)->first();

    if (!$loan) {
        return response()->json([
            'success' => false,
            'message' => 'Loan not found'
        ], 404);
    }

    $loan->update([
        'status' => $request->status
    ]);

    return response()->json([
        'success' => true,
        'message' => "Loan status updated to {$request->status}",
        'data' => [
            'loan_code' => $loan->loan_code,
            'status' => $loan->status
        ]
    ]);
}


}