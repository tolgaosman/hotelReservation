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
        Schema::table('roles', function (Blueprint $table) {
            // When set, a user with this role only sees employees whose
            // profession is in this list on the Ã‡alÄ±ÅŸanlar page (a supervisor
            // role scoped to their own team). Null/empty means unscoped â€”
            // every employee stays visible, same as before this column existed.
            $table->json('visible_professions')->nullable()->after('is_system');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('visible_professions');
        });
    }
};
