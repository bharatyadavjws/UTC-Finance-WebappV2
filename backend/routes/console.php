<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('emis:mark-overdue')->dailyAt('00:05');