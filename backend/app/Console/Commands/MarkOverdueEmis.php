<?php

namespace App\Console\Commands;

use App\Models\EmiSchedule;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MarkOverdueEmis extends Command
{
    protected $signature   = 'emis:mark-overdue';
    protected $description = 'Mark all pending EMIs past their due date as overdue';

    public function handle(): void
    {
        $today = Carbon::today();

        $count = EmiSchedule::where('status', 'pending')
            ->whereDate('due_date', '<', $today)
            ->update([
                'status'     => 'overdue',
                'updated_at' => now(),
            ]);

        $this->info("Marked {$count} EMI(s) as overdue.");
    }
}