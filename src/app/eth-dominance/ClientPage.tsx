'use client';

import ETHDominance from '@/components/ETHDominance';
import EthereumMetrics from '@/components/EthereumMetrics';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface DominanceData {
  date: string;
  dominance: number;
}

export default function ClientPage() {
  const [data, setData] = useState<DominanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const loadingToast = toast.loading('Fetching ETH dominance data...', {
        position: 'top-right',
      });
      try {
        const response = await fetch('/api/eth-dominance');
        const result = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a few minutes.');
          }
          throw new Error(result.error || 'Failed to fetch ETH dominance data');
        }

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data received from server');
        }

        setData(result.data);
        setError(null);
        toast.success('Data updated successfully', { 
          id: loadingToast,
          duration: 3000,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load ETH dominance data';
        setError(errorMessage);
        toast.error(errorMessage, { 
          id: loadingToast,
          duration: 4000,
        });
        console.error('Error fetching ETH dominance data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval for periodic updates
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4"></div>
            <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"></div>
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Panel Skeleton */}
            <div className="w-full lg:col-span-7 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <div className="animate-pulse">
                {/* Current ETH Dominance Box */}
                <div className="w-48 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg mb-6"></div>
                
                {/* Time Range Selector */}
                <div className="flex justify-center gap-4 mb-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>

            {/* Right Panel Skeleton */}
            <div className="w-full lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-3/4 bg-gray-100 dark:bg-gray-700 rounded mb-6"></div>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Understanding ETH Dominance Section Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mt-8">
            <div className="animate-pulse">
              <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="space-y-4 mb-8">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Ethereum Market Dominance Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-3xl mx-auto">
              Track Ethereum&apos;s influence in the cryptocurrency market through its dominance metrics
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6 lg:gap-8">
              <div className="w-full lg:col-span-7 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                {data.length > 0 && <ETHDominance data={data} isDetailPage={true} />}
              </div>
              <div className="w-full lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <EthereumMetrics isDetailPage={true} />
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mt-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white mb-4">
              Understanding ETH Dominance
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p className="text-base sm:text-lg">
                Ethereum dominance represents Ethereum&apos;s market capitalization as a percentage of the total cryptocurrency market capitalization. This metric is crucial for understanding Ethereum&apos;s relative strength and influence in the crypto market.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    High Dominance Implications
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-base sm:text-lg">
                    <li>Strong Ethereum ecosystem</li>
                    <li>DeFi and NFT market growth</li>
                    <li>Smart contract platform leadership</li>
                    <li>Institutional adoption</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Low Dominance Implications
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-base sm:text-lg">
                    <li>Alternative L1 competition</li>
                    <li>Market diversification</li>
                    <li>Layer 2 solution growth</li>
                    <li>Scaling challenges</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 