import { useState, useEffect } from 'react';
import { api } from './api';

let fetchPromise: Promise<any> | null = null;
let cachedRates: ExchangeRates | null = null;

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
      if (cachedRates) {
        if (mounted) {
          setRates(cachedRates);
          setLoading(false);
        }
        return;
      }

      if (!fetchPromise) {
        fetchPromise = api.get('/api/exchange-rates').then(res => {
          if (res.data?.data) {
            cachedRates = res.data.data;
          }
          return res;
        }).catch(err => {
          console.error("Failed to fetch exchange rates", err);
          fetchPromise = null; // allow retry on failure
        });
      }

      try {
        await fetchPromise;
        if (mounted && cachedRates) {
          setRates(cachedRates);
        }
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
