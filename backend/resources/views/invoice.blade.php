<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fatura - {{ $reservation->id }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
        .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #ea580c; }
        .hotel-details { float: right; text-align: right; font-size: 12px; color: #666; }
        .invoice-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { width: 50%; vertical-align: top; }
        .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
        .label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f4f4f4; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
        .items-table td { border-bottom: 1px solid #eee; padding: 12px 10px; }
        .items-table .amount { text-align: right; font-weight: bold; }
        .total-row td { background: #fff5f0; border-bottom: 2px solid #ea580c; font-size: 16px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="hotel-details">
            Otel Yönetim A.Ş.<br>
            Atatürk Cad. No:123 Merkez/İstanbul<br>
            Vergi No: 1234567890<br>
            info@hotel.test
        </div>
        <div class="logo">Otel Yönetim Sistemi</div>
        <div style="clear:both;"></div>
    </div>

    <div class="invoice-title">Konaklama Faturası</div>

    <table class="info-table">
        <tr>
            <td style="padding-right: 15px;">
                <div class="info-box">
                    <span class="label">Müşteri Bilgileri</span>
                    <span class="value">{{ $reservation->guest->full_name }}</span><br>
                    {{ $reservation->guest->email }}<br>
                    {{ $reservation->guest->phone }}<br>
                    {{ $reservation->guest->country }}
                </div>
            </td>
            <td style="padding-left: 15px;">
                <div class="info-box">
                    <span class="label">Fatura & Rezervasyon</span>
                    Fatura No: #INV-{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}<br>
                    Tarih: {{ now()->format('d.m.Y') }}<br>
                    Check-in: {{ \Carbon\Carbon::parse($reservation->check_in)->format('d.m.Y') }}<br>
                    Check-out: {{ \Carbon\Carbon::parse($reservation->check_out)->format('d.m.Y') }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Açıklama</th>
                <th>Oda Tipi</th>
                <th>Gece Sayısı</th>
                <th class="amount">Birim Fiyat</th>
                <th class="amount">Toplam</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Oda Konaklaması (Oda No: {{ $reservation->room->number }})</td>
                <td>{{ $reservation->room->type }}</td>
                <td>{{ \Carbon\Carbon::parse($reservation->check_in)->diffInDays(\Carbon\Carbon::parse($reservation->check_out)) }} Gece</td>
                <td class="amount">₺{{ number_format($reservation->room->nightly_rate, 2, ',', '.') }}</td>
                <td class="amount">₺{{ number_format($reservation->total_amount, 2, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="4" style="text-align: right; font-weight: bold;">Genel Toplam</td>
                <td class="amount">₺{{ number_format($reservation->total_amount, 2, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    
    <div>
        <strong>Ödeme Geçmişi:</strong>
        <ul style="font-size: 12px; margin-top: 5px;">
            @foreach($reservation->payments as $payment)
                <li>{{ \Carbon\Carbon::parse($payment->created_at)->format('d.m.Y') }} - {{ $payment->method->value }} - ₺{{ number_format($payment->amount, 2, ',', '.') }}</li>
            @endforeach
            @if($reservation->payments->isEmpty())
                <li>Henüz ödeme alınmadı.</li>
            @endif
        </ul>
    </div>

    <div class="footer">
        Bizi tercih ettiğiniz için teşekkür ederiz.<br>
        Bu belge elektronik olarak üretilmiştir.
    </div>

</body>
</html>
