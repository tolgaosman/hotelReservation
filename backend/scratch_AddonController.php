<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Addon;

class AddonController extends Controller
{
    public function index()
    {
        return Addon::where('is_active', true)->get();
    }
}
