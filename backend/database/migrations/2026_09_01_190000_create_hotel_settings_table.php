<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(18);
            $table->time('check_in_time')->default('14:00');
            $table->time('check_out_time')->default('12:00');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_settings');
    }
};
