<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Convert all existing statuses to the new 3-status system
        DB::table('loans')->whereIn('status', ['Approved', 'Active', 'active', 'approved'])->update(['status' => 'Disbursed']);
        DB::table('loans')->whereIn('status', ['Rejected', 'Cancelled', 'Blocked', 'rejected', 'cancelled', 'blocked'])->update(['status' => 'Closed']);
        DB::table('loans')->whereIn('status', ['overdue', 'Overdue'])->update(['status' => 'Disbursed']);
        DB::table('loans')->whereIn('status', ['disbursed'])->update(['status' => 'Disbursed']);
        DB::table('loans')->whereIn('status', ['pending'])->update(['status' => 'Pending']);
        DB::table('loans')->whereIn('status', ['closed'])->update(['status' => 'Closed']);
    }

    public function down(): void
    {
        // Cannot reliably reverse this migration
    }
};