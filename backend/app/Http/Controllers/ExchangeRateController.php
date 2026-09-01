<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Exception;

class ExchangeRateController extends Controller
{
    public function getRates()
    {
        $cacheKey = 'kktc_exchange_rates';
        
        // Cache for 6 hours (21600 seconds)
        $rates = Cache::remember($cacheKey, 21600, function () {
            try {
                $response = Http::timeout(10)->withoutVerifying()->get('https://www.mb.gov.ct.tr/kur/gunluk.xml');
                
                if (!$response->successful()) {
                    throw new Exception("Failed to fetch rates from KKTC MB");
                }
                
                $xml = simplexml_load_string($response->body());
                if ($xml === false) {
                    throw new Exception("Failed to parse XML from KKTC MB");
                }
                
                $parsedRates = [
                    'TRY' => 1.0 // Base currency
                ];
                
                // We want USD, EUR, GBP
                $targetCurrencies = ['USD', 'EUR', 'GBP'];
                
                foreach ($xml->Resmi_Kurlar->Resmi_Kur as $kur) {
                    $symbol = (string) $kur->Sembol;
                    
                    if (in_array($symbol, $targetCurrencies)) {
                        $parsedRates[$symbol] = (float) $kur->Doviz_Satis;
                    }
                }
                
                return $parsedRates;
                
            } catch (Exception $e) {
                // If fetching fails, return empty or fallback
                return null;
            }
        });
        
        if (!$rates) {
            return response()->json([
                'success' => false,
                'message' => 'Döviz kurları alınamadı.'
            ], 500);
        }
        
        return response()->json([
            'success' => true,
            'data' => $rates
        ]);
    }
}
