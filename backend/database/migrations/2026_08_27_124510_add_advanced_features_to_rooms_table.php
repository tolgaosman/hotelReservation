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
        Schema::table('rooms', function (Blueprint $table) {
            $table->boolean('is_maintenance')->default(false)->after('housekeeping_status');
            $table->string('maintenance_note')->nullable()->after('is_maintenance');
            $table->string('assigned_staff')->nullable()->after('maintenance_note');
            $table->boolean('is_priority_cleaning')->default(false)->after('assigned_staff');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['is_maintenance', 'maintenance_note', 'assigned_staff', 'is_priority_cleaning']);
        });
    }
};
