<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retailers', function (Blueprint $table) {
            $table->id();
            $table->string('retailer_code')->unique();
            $table->foreignId('agent_id')->constrained('users');
            $table->string('shop_name', 150);
            $table->string('owner_name', 100);
            $table->string('mobile', 10);
            $table->string('alternate_mobile', 10)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('gst_number', 15)->nullable();
            $table->string('pan_number', 10)->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('pincode', 6);
            $table->string('status', 30)->default('Pending');
            $table->timestamps();

            $table->index(['agent_id', 'status']);
            $table->index('mobile');
            $table->index(['city', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retailers');
    }
};