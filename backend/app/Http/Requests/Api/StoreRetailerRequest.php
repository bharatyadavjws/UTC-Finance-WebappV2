<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreRetailerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_name' => ['required', 'string', 'max:150'],
            'owner_name' => ['required', 'string', 'max:100'],
            'mobile' => ['required', 'digits:10'],
            'alternate_mobile' => ['nullable', 'digits:10', 'different:mobile'],
            'email' => ['nullable', 'email', 'max:150'],
            'gst_number' => ['nullable', 'string', 'size:15'],
            'pan_number' => ['nullable', 'string', 'size:10'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['required', 'digits:6'],
        ];
    }
}