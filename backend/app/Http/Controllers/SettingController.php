<?php

namespace App\Http\Controllers;

use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Http\Resources\HotelSettingResource;
use App\Models\HotelSetting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return $this->success(new HotelSettingResource(HotelSetting::current()));
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $setting = HotelSetting::current();
        $setting->update($request->validated());

        return $this->success(new HotelSettingResource($setting), 'Ayarlar güncellendi.');
    }
}
