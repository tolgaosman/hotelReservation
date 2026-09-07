<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\UpdateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Customer;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Addon;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ReservationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var Customer $customer */
        $customer = $request->attributes->get('customer');

        $reservations = Reservation::query()
            ->whereHas('guest', fn ($query) => $query->where('customer_id', $customer->id))
            ->with(['room.typeContent', 'guest'])
            ->orderByDesc('check_in')
            ->get();

        return ReservationResource::collection($reservations);
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var Customer $customer */
        $customer = $request->attributes->get('customer');

        if (! filled($customer->identity_number)) {
            throw new HttpException(422, 'Rezervasyon iÃ§in profilinizde Pasaport/Kimlik No kayÄ±tlÄ± olmalÄ±dÄ±r.');
        }

        $reservation = DB::transaction(function () use ($data, $customer) {
            $selectedRoom = Room::findOrFail($data['roomId']);

            $room = Room::query()
                ->where('type', $selectedRoom->type)
                ->where('capacity', '>=', $data['guestCount'])
                ->available()
                ->freeBetween($data['checkIn'], $data['checkOut'])
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (! $room) {
                throw new HttpException(409, 'SeÃ§tiÄŸiniz oda tipi bu tarihlerde dolu.');
            }

            $guest = Guest::updateOrCreate(
                ['identity_number' => $customer->identity_number],
                [
                    'customer_id' => $customer->id,
                    'full_name' => $data['guest']['fullName'],
                    'phone' => $data['guest']['phone'],
                    'email' => $data['guest']['email'] ?? null,
                    'country' => $data['guest']['country'] ?? null,
                ],
            );

            $checkIn = Carbon::parse($data['checkIn']);
            $checkOut = Carbon::parse($data['checkOut']);
            $nights = $checkIn->diffInDays($checkOut);
            
            $roomTotal = round((float) $room->nightly_rate * $nights, 2);
            $addonTotal = 0;
            
            $addons = [];
            if (!empty($data['addonIds'])) {
                $addons = Addon::whereIn('id', $data['addonIds'])->where('is_active', true)->get();
                foreach($addons as $addon) {
                    $addonTotal += $addon->price;
                }
            }

            $reservation = Reservation::create([
                'guest_id' => $guest->id,
                'room_id' => $room->id,
                'check_in' => $data['checkIn'],
                'check_out' => $data['checkOut'],
                'guest_count' => $data['guestCount'],
                'status' => ReservationStatus::Pending->value,
                'total_amount' => $roomTotal + $addonTotal,
                'created_by' => null,
                'note' => $data['note'] ?? null,
            ]);
            
            if (count($addons) > 0) {
                foreach($addons as $addon) {
                    DB::table('addon_reservation')->insert([
                        'reservation_id' => $reservation->id,
                        'addon_id' => $addon->id,
                        'price_at_booking' => $addon->price,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            return $reservation->load('guest');
        });

        return (new ReservationResource($reservation))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->attributes->get('customer');

        if ($reservation->guest->customer_id !== $customer->id) {
            throw new HttpException(403, 'Bu iÅŸlem iÃ§in yetkiniz yok.');
        }

        if ($reservation->status !== ReservationStatus::Pending->value) {
            throw new HttpException(422, 'Sadece bekleyen rezervasyonlar dÃ¼zenlenebilir.');
        }

        $data = $request->validated();

        $reservation = DB::transaction(function () use ($data, $reservation) {
            $checkIn = Carbon::parse($data['checkIn']);
            $checkOut = Carbon::parse($data['checkOut']);
            $nights = $checkIn->diffInDays($checkOut);
            
            $requestedRoomId = $data['roomId'] ?? $reservation->room_id;
            
            // Re-calculate room total
            $roomTotal = 0;
            if ($reservation->check_in !== $data['checkIn'] || $reservation->check_out !== $data['checkOut'] || $reservation->room_id !== (int) $requestedRoomId) {
                $requestedRoom = Room::findOrFail($requestedRoomId);
                
                $room = Room::query()
                    ->where('type', $requestedRoom->type)
                    ->where('capacity', '>=', $data['guestCount'])
                    ->available()
                    ->freeBetween($data['checkIn'], $data['checkOut'], $reservation->id)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();
                
                if (! $room) {
                    throw new HttpException(409, 'SeÃ§tiÄŸiniz oda tipi bu tarihlerde dolu.');
                }
                
                $reservation->room_id = $room->id;
                $roomTotal = round((float) $room->nightly_rate * $nights, 2);
            } else {
                $roomTotal = round((float) $reservation->room->nightly_rate * $nights, 2);
            }

            // Get existing addons total
            $addonTotal = DB::table('addon_reservation')
                ->where('reservation_id', $reservation->id)
                ->sum('price_at_booking');

            $reservation->total_amount = $roomTotal + $addonTotal;
            $reservation->check_in = $data['checkIn'];
            $reservation->check_out = $data['checkOut'];
            $reservation->guest_count = $data['guestCount'];
            $reservation->note = $data['note'] ?? $reservation->note;
            $reservation->save();

            return $reservation->load(['room.typeContent', 'guest']);
        });

        return (new ReservationResource($reservation))
            ->response()
            ->setStatusCode(200);
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->attributes->get('customer');

        if ($reservation->guest->customer_id !== $customer->id) {
            throw new HttpException(403, 'Bu iÅŸlem iÃ§in yetkiniz yok.');
        }

        if ($reservation->status !== ReservationStatus::Pending->value) {
            throw new HttpException(422, 'Sadece bekleyen rezervasyonlar iptal edilebilir.');
        }

        $reservation->status = ReservationStatus::Cancelled->value;
        $reservation->save();

        return response()->json(['message' => 'Rezervasyon baÅŸarÄ±yla iptal edildi.']);
    }
}
