<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add passive to enum
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE rooms MODIFY COLUMN status ENUM('available', 'occupied', 'maintenance', 'passive') DEFAULT 'available'");

        // Migrate existing active = false to status = passive
        \Illuminate\Support\Facades\DB::table('rooms')->where('active', false)->update(['status' => 'passive']);

        // Drop active column
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->boolean('active')->default(true);
        });

        \Illuminate\Support\Facades\DB::table('rooms')->where('status', 'passive')->update([
            'status' => 'available',
            'active' => false,
        ]);

        \Illuminate\Support\Facades\DB::statement("ALTER TABLE rooms MODIFY COLUMN status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available'");
    }
};
