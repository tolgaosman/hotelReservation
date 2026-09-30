<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

abstract class Controller
{
    use ApiResponder, AuthorizesRequests;

    // Clients (e.g. the frontend's fetchAllPages helper) request large pages
    // to minimize round-trips; without a ceiling here a client-supplied
    // per_page is used verbatim and can force an unbounded single query. The
    // frontend's own bulk-load page size is 1000, so the max matches that —
    // a lower cap would just fragment today's normal load into many more
    // round-trips without actually bounding anything client code relies on.
    protected function perPage(Request $request, int $default = 15, int $max = 1000): int
    {
        return max(1, min($request->integer('per_page', $default), $max));
    }
}
