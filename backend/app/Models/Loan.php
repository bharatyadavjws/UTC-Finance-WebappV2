<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $fillable = [
        'loan_code',
        'agent_id',
        'retailer_code',

        // Customer
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_dob',
        'customer_monthly_salary',
        'customer_address',
        'customer_photo',

        // KYC
        'aadhar_number',
        'aadhar_front',
        'aadhar_back',
        'pan_number',
        'pan_photo',
        'account_number',
        'ifsc_code',

        // Device
        'item_name',
        'item_value',
        'item_imei',
        'item_photo',
        'device_type',

        // Eligibility
        'down_payment',
        'cibil_score',
        'current_emi',

        // Plan
        'plan_key',
        'plan_label',
        'plan_months',
        'loan_amount',
        'net_disbursement',
        'emi_amount',
        'processing_fee',
        'total_repay',
        'interest_amount',
        'av_fee',
        'app_lock_fee',
        'total_charges',
        'first_emi_date',
        'last_repayment_date',
        'tenure_days',

        'status',
    ];

    protected $casts = [
        'customer_dob'            => 'date',
        'customer_monthly_salary' => 'decimal:2',
        'item_value'              => 'decimal:2',
        'down_payment'            => 'decimal:2',
        'current_emi'             => 'decimal:2',
        'loan_amount'             => 'decimal:2',
        'net_disbursement'        => 'decimal:2',
        'emi_amount'              => 'decimal:2',
        'processing_fee'          => 'decimal:2',
        'total_repay'             => 'decimal:2',
        'interest_amount'         => 'decimal:2',
        'av_fee'                  => 'decimal:2',
        'app_lock_fee'            => 'decimal:2',
        'total_charges'           => 'decimal:2',
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function retailer()
    {
        return $this->belongsTo(Retailer::class, 'retailer_code', 'retailer_code');
    }

    protected static function generateLoanCode(): string
    {
        do {
            $code = 'LN' . date('ymd') . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('loan_code', $code)->exists());

        return $code;
    }
}