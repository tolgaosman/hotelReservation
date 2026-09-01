<?php

namespace App\Enums;

enum Department: string
{
    case Servis = 'servis';
    case Muhasebe = 'muhasebe';
    case Resepsiyon = 'resepsiyon';
    case TemizlikTamir = 'temizlik_tamir';

    public function label(): string
    {
        return match ($this) {
            self::Servis => 'Servis (Garson)',
            self::Muhasebe => 'Muhasebe',
            self::Resepsiyon => 'Resepsiyon',
            self::TemizlikTamir => 'Temizlik & Tamir',
        };
    }
}
