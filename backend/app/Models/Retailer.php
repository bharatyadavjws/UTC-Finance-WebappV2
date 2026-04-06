<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Retailer extends Model
{
    protected $fillable = [
        'retailer_code',
        'agent_id',
        'shop_name',
        'owner_name',
        'mobile',
        'alternate_mobile',
        'email',
        'gst_number',
        'pan_number',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'pincode',
        'status',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function getRouteKeyName(): string
    {
        return 'retailer_code';
    }
}