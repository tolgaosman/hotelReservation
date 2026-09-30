<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_reservations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone', 32);
            $table->string('email')->nullable();
            $table->unsignedTinyInteger('party_size');
            $table->date('date');
            $table->string('time', 5);
            $table->text('note')->nullable();
            $table->boolean('is_hotel_guest')->default(false);
            $table->foreignId('reservation_id')->nullable()->constrained()->nullOnDelete();
            $table->string('payment_status', 20)->default('pay_at_hotel');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('card_holder_name')->nullable();
            $table->string('card_last_four', 4)->nullable();
            $table->timestamps();

            $table->index(['date', 'time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_reservations');
    }
};
