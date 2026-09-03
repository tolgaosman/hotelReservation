<?php

namespace App\Http\Controllers;

use App\Models\Addon;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    public function index()
    {
        return Addon::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $addon = Addon::create($validated);
        return response()->json($addon, 201);
    }

    public function update(Request $request, Addon $addon)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $addon->update($validated);
        return response()->json($addon);
    }

    public function destroy(Addon $addon)
    {
        $addon->delete();
        return response()->json(null, 204);
    }
}
