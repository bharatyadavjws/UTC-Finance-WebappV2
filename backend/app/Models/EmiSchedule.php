<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmiSchedule extends Model
{
    protected $fillable = [
        'loan_code',
        'installment_number',
        'due_date',
        'amount',
        'principal',
        'interest',
        'status',
        'paid_at',
        'payment_reference',
        'note',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at'  => 'date',
        'amount'   => 'decimal:2',
        'principal'=> 'decimal:2',
        'interest' => 'decimal:2',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_code', 'loan_code');
    }
}