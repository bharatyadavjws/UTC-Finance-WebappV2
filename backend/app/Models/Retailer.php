<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Retailer extends Model
{
    protected $fillable = [
        'retailer_code',
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
        // agent_id removed — now handled via pivot
    ];

    /**
     * Agents assigned to this retailer (many-to-many)
     */
    public function agents()
    {
        return $this->belongsToMany(User::class, 'retailer_agent', 'retailer_id', 'agent_id')
                    ->withTimestamps();
    }
}