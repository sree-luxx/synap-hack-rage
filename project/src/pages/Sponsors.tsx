import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../lib/api';

type Sponsor = { _id: string; name: string; tier: string; logoUrl: string; websiteUrl: string; description?: string };

const tiersOrder = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"] as const;

export const Sponsors: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<Sponsor[]>(`/api/sponsors`);
        setSponsors(list || []);
      } catch { setSponsors([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const byTier = tiersOrder.map(tier => ({ tier, items: sponsors.filter(s => s.tier === tier) }));

  const handleClick = async (id: string, url: string) => {
    try { await apiFetch(`/api/sponsors/click`, { method: 'POST', body: { id } }); } catch {}
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Sponsors</h1>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        byTier.map(section => (
          <Card key={section.tier} roleColor="purple">
            <div className="mb-3 text-gray-300 font-medium">{section.tier}</div>
            {section.items.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {section.items.map(s => (
                  <button key={s._id} onClick={() => handleClick(s._id, s.websiteUrl)} className="neon-card p-3 rounded hover:scale-[1.01] transition">
                    <img src={s.logoUrl} alt={s.name} className="w-full h-20 object-contain" />
                    <div className="mt-2 text-sm text-white text-center">{s.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No sponsors in this tier yet.</div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};

export default Sponsors;


