<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        $payments = Payment::query()
            ->when($request->filled('reservation_id'), fn ($q) => $q->where('reservation_id', $request->input('reservation_id')))
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        return $this->paginated($payments, PaymentResource::class);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $payment = $this->payments->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return $this->success(new PaymentResource($payment), 'Ã–deme kaydedildi.', 201);
    }
}
