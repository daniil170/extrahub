import { useState, useEffect, useCallback } from 'react';
import { fetchInviteByToken, acceptInvite } from './api.js';

export function useParentInvite(token) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const loadInvite = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchInviteByToken(token);
      setInvite(data);
      if (data?.status === 'accepted') {
        setIsAccepted(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleAccept = async (parentId) => {
    if (!invite) return;
    await acceptInvite(invite.id, parentId);
    setIsAccepted(true);
  };

  return { invite, loading, error, isAccepted, accept: handleAccept };
}
