<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RetailerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'retailer_code'    => $this->retailer_code,
            'shop_name'        => $this->shop_name,
            'owner_name'       => $this->owner_name,
            'mobile'           => $this->mobile,
            'alternate_mobile' => $this->alternate_mobile,
            'email'            => $this->email,
            'gst_number'       => $this->gst_number,
            'pan_number'       => $this->pan_number,
            'address_line_1'   => $this->address_line_1,
            'address_line_2'   => $this->address_line_2,
            'city'             => $this->city,
            'state'            => $this->state,
            'pincode'          => $this->pincode,
            'status'           => $this->status,
            'assigned_agents'  => $this->whenLoaded('agents', fn() =>
                $this->agents->map(fn($a) => [
                    'id'   => $a->id,
                    'name' => $a->name,
                ])
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}