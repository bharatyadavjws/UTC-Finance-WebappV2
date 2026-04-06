<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RetailerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->retailer_code,
            'db_id' => $this->id,
            'shop_name' => $this->shop_name,
            'owner_name' => $this->owner_name,
            'mobile' => $this->mobile,
            'alternate_mobile' => $this->alternate_mobile,
            'email' => $this->email,
            'gst_number' => $this->gst_number,
            'pan_number' => $this->pan_number,
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,
            'status' => $this->status,
            'agent_id' => $this->agent_id,
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),
            'updated_at' => optional($this->updated_at)->format('Y-m-d H:i:s'),
        ];
    }
}