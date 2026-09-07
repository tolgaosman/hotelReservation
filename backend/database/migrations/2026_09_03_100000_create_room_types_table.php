<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('capacity');
            $table->decimal('nightly_rate', 10, 2);
            $table->json('amenities')->nullable();
            $table->string('bed_type', 50)->nullable();
            $table->unsignedSmallInteger('size_m2')->nullable();
            $table->string('view', 50)->nullable();
            // Reserved for a future image-upload feature â€” no code reads or
            // writes this column yet. Adding it now avoids a migration on a
            // populated table later; keep it out of $fillable/the resource
            // until the upload endpoint actually exists.
            $table->json('images')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_types');
    }
};
