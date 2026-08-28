<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaginationTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    // Note: a PDF-rendering regression test for invoice.blade.php's
    // Guest::first_name/last_name bug (the field is actually full_name) was
    // intentionally not added here — this environment's dompdf/dompdf
    // install is broken independent of this codebase (composer extracts it
    // to an empty directory), so a test exercising the PDF pipeline can't
    // run here. The template fix itself is in invoice.blade.php.

    // Regression for Controller::perPage(): per_page=0 used to fall through
    // min()'s upper bound with no lower bound, so paginate(0) returned every
    // row instead of the requested page size.
    public function test_per_page_zero_does_not_return_every_row(): void
    {
        $this->actingAdmin();
        Room::factory()->count(5)->create();

        $response = $this->getJson('/api/rooms?per_page=0');

        $response->assertStatus(200);
        $this->assertLessThanOrEqual(1, count($response->json('data.items')));
    }
}
