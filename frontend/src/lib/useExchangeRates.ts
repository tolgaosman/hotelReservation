import { useState, useEffect } from 'react';
import { api } from './api';

interface ExchangeRates {
  TRY: number;
  USD?: number;
  EUR?: number;
  GBP?: number;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchRates() {
      try {
        const res = await api.get('/api/exchange-rates');
        if (mounted && res.data?.data) {
          setRates(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch exchange rates", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRates();

    return () => {
      mounted = false;
    };
  }, []);

  return { rates, loading };
}
