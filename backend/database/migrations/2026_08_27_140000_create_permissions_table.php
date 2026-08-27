<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            // Groups permissions under the page/nav item they belong to (e.g. "dashboard", "reservations").
            $table->string('group');
            $table->string('group_label');
            // Page-level permissions gate a whole nav item; in-page permissions are only meaningful once the page one is granted.
            $table->boolean('is_page_permission')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
