<?php

namespace App\Providers;

use App\Models\Retailer;
use App\Policies\RetailerPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Retailer::class => RetailerPolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}