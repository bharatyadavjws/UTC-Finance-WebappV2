<?php

namespace App\Policies;

use App\Models\Retailer;
use App\Models\User;

class RetailerPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['agent', 'utc_team', 'admin', 'investor']);
    }

    public function view(User $user, Retailer $retailer): bool
    {
        if (in_array($user->role, ['utc_team', 'admin', 'investor'])) {
            return true;
        }

        return $user->role === 'agent' && (int) $retailer->agent_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['agent', 'utc_team', 'admin']);
    }

    public function update(User $user, Retailer $retailer): bool
    {
        if (in_array($user->role, ['utc_team', 'admin'])) {
            return true;
        }

        return $user->role === 'agent' && (int) $retailer->agent_id === (int) $user->id;
    }

    public function updateStatus(User $user, Retailer $retailer): bool
    {
        return in_array($user->role, ['utc_team', 'admin']);
    }
}