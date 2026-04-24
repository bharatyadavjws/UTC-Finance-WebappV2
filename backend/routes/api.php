<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\RetailerController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\EmiController;
use App\Http\Controllers\CRM\CommissionController;

// Public routes
Route::post('/login',  [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::get('/loans/{loanCode}', [LoanController::class, 'show']);
    Route::patch('/loans/{loanCode}/status', [LoanController::class, 'updateStatus']);



    // Retailers
    Route::get('/retailers',                        [RetailerController::class, 'index']);
    Route::post('/retailers',                       [RetailerController::class, 'store']);
    Route::get('/retailers/{retailer}',             [RetailerController::class, 'show']);
    Route::put('/retailers/{retailer}',             [RetailerController::class, 'update']);
    Route::patch('/retailers/{retailer}/status',    [RetailerController::class, 'updateStatus']);

    // Loans
    Route::get('/loans',  [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);

    // Agents (UTC Team only)
    Route::get('/agents',       [AgentController::class, 'index']);
    Route::post('/agents',      [AgentController::class, 'store']);
    Route::get('/agents/{user}', [AgentController::class, 'show']);

    // EMI Book
    Route::get('/emis',                              [EmiController::class, 'index']);
    Route::patch('/emis/{id}/status',                [EmiController::class, 'updateStatus']);
    Route::post('/loans/{loanCode}/generate-emis',   [EmiController::class, 'generate']);

    Route::get('/crm/commissions', [CommissionController::class, 'index']);
    Route::post('/crm/commissions/{id}/mark-paid', [CommissionController::class, 'markPaid']);
    Route::post('/crm/loans/{id}/disburse', [LoanController::class, 'markAsDisbursed']);
    Route::get('/crm/loans', [LoanController::class, 'crmIndex']);
});
