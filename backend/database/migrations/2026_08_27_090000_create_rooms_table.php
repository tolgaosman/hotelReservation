<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->unique();
            $table->string('type', 50);
            $table->unsignedTinyInteger('capacity');
            $table->decimal('nightly_rate', 10, 2);
            $table->json('amenities')->nullable();
            $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['status', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
