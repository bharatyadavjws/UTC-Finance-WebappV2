<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('loan_code')->unique();

            // Relationships
            $table->foreignId('agent_id')->constrained('users');
            $table->string('retailer_code', 20);
            $table->foreign('retailer_code')->references('retailer_code')->on('retailers');

            // Customer
            $table->string('customer_name', 150);
            $table->string('customer_phone', 15);
            $table->string('customer_email', 150)->nullable();
            $table->date('customer_dob')->nullable();
            $table->decimal('customer_monthly_salary', 10, 2)->nullable();
            $table->text('customer_address')->nullable();
            $table->string('customer_photo')->nullable();

            // KYC
            $table->string('aadhar_number', 12)->nullable();
            $table->string('aadhar_front')->nullable();
            $table->string('aadhar_back')->nullable();
            $table->string('pan_number', 10)->nullable();
            $table->string('pan_photo')->nullable();
            $table->string('account_number', 30)->nullable();
            $table->string('ifsc_code', 15)->nullable();

            // Device
            $table->string('item_name', 150)->nullable();
            $table->decimal('item_value', 10, 2)->nullable();
            $table->string('item_imei', 20)->nullable();
            $table->string('item_photo')->nullable();
            $table->string('device_type', 10)->default('ANDROID');

            // Eligibility inputs
            $table->decimal('down_payment', 10, 2)->nullable();
            $table->integer('cibil_score')->nullable();
            $table->decimal('current_emi', 10, 2)->nullable();

            // Selected EMI plan (stored as JSON)
            $table->string('plan_key', 10)->nullable();
            $table->string('plan_label', 20)->nullable();
            $table->integer('plan_months')->nullable();
            $table->decimal('loan_amount', 10, 2)->nullable();
            $table->decimal('net_disbursement', 10, 2)->nullable();
            $table->decimal('emi_amount', 10, 2)->nullable();
            $table->decimal('processing_fee', 10, 2)->nullable();
            $table->decimal('total_repay', 10, 2)->nullable();
            $table->decimal('interest_amount', 10, 2)->nullable();
            $table->decimal('av_fee', 10, 2)->nullable();
            $table->decimal('app_lock_fee', 10, 2)->nullable();
            $table->decimal('total_charges', 10, 2)->nullable();
            $table->string('first_emi_date', 30)->nullable();
            $table->string('last_repayment_date', 30)->nullable();
            $table->integer('tenure_days')->nullable();

            // Status
            $table->string('status', 30)->default('Pending');

            $table->timestamps();

            $table->index(['agent_id', 'status']);
            $table->index('retailer_code');
            $table->index('customer_phone');
            $table->index('pan_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};