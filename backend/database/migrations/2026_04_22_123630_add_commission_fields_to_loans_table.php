<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->decimal('commission_amount', 10, 2)->default(0)->after('loan_amount');
            $table->enum('commission_status', ['unpaid', 'paid'])->default('unpaid')->after('commission_amount');
            $table->timestamp('disbursed_at')->nullable()->after('commission_status');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['commission_amount', 'commission_status', 'disbursed_at']);
        });
    }
};