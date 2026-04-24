<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emi_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('loan_code');
            $table->foreign('loan_code')->references('loan_code')->on('loans')->onDelete('cascade');
            $table->unsignedTinyInteger('installment_number');
            $table->date('due_date');
            $table->decimal('amount', 10, 2);
            $table->decimal('principal', 10, 2)->default(0);
            $table->decimal('interest', 10, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->date('paid_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['loan_code', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emi_schedules');
    }
};