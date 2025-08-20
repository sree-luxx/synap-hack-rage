import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../lib/api';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const roleColor = useMemo(() => (user?.role === 'judge' ? 'orange' : user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');
  const [certs, setCerts] = useState<any[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);

  const save = async () => {
    await updateProfile({ name, avatar, socialLinks: { github, linkedin } as any });
    toast.success('Profile updated');
  };

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try { setCerts(await apiFetch<any[]>(`/api/certificates?userId=${encodeURIComponent(user.id)}`)); } catch { setCerts([]); }
      try { setNfts(await apiFetch<any[]>(`/api/nft?userId=${encodeURIComponent(user.id)}`)); } catch { setNfts([]); }
    })();
  }, [user?.id]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Profile Settings</h1>
      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} roleColor={roleColor} />
          <Input label="Avatar URL" value={avatar} onChange={(e) => setAvatar(e.target.value)} roleColor={roleColor} />
          <Input label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" roleColor={roleColor} />
          <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" roleColor={roleColor} />
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={save} roleColor={roleColor}>Save</Button>
        </div>
      </Card>

      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-white font-medium mb-2">Certificates</div>
            <div className="space-y-2">
              {certs.map((c:any) => (
                <a key={String(c._id || c.id)} href={c.url} target="_blank" className="block text-neon-blue hover:underline">{c.role} — {c.eventId}</a>
              ))}
              {!certs.length && <div className="text-sm text-gray-500">No certificates yet.</div>}
            </div>
          </div>
          <div>
            <div className="text-white font-medium mb-2">POAP / NFTs</div>
            <div className="space-y-2">
              {nfts.map((n:any) => (
                <div key={String(n._id || n.id)} className="text-sm text-gray-300">
                  <div>Token #{n.tokenId} on {n.chain}</div>
                  {n.txHash && <a href={`https://$${'{'}n.chain === 'sepolia' ? 'sepolia.' : ''}${'{'}n.chain?.includes('polygon') ? 'amoy.polygonscan.com' : 'etherscan.io'}/tx/${'$'}{n.txHash}`} target="_blank" className="text-neon-blue hover:underline">View Tx</a>}
                </div>
              ))}
              {!nfts.length && <div className="text-sm text-gray-500">No NFTs yet.</div>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;



