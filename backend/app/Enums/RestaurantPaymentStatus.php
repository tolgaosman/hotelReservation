<?php

namespace App\Enums;

enum RestaurantPaymentStatus: string
{
    case Waived = 'waived';
    case PayAtHotel = 'pay_at_hotel';
}
