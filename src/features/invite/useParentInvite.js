import { useState, useEffect, useCallback } from 'react';
import { fetchInviteDetails, approveInviteCall, rejectInviteCall } from './api.js';

export function useParentInvite(token) {
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadInvite = useCallback(async () => {
    if (!token) {
      setError('Токен приглашения отсутствует');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchInviteDetails(token);
      setInviteData(data);

      if (data?.invite?.status === 'accepted') {
        setIsAccepted(true);
      } else if (data?.invite?.status === 'cancelled') {
        setIsRejected(true);
      }
    } catch (err) {
      console.error('Invite loading error:', err);
      const msg = err.message || '';
      if (msg.includes('истёк') || msg.includes('expired')) {
        setIsExpired(true);
      } else if (msg.includes('уже') || msg.includes('активно')) {
        setIsAccepted(true);
      } else {
        setError(msg || 'Ссылка устарела или недействительна');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const approve = useCallback(async () => {
    if (!token) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await approveInviteCall(token);
      setIsAccepted(true);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('истёк') || msg.includes('expired')) {
        setIsExpired(true);
      } else {
        setActionError(msg || 'Не удалось подтвердить запись. Попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [token]);

  const reject = useCallback(async () => {
    if (!token) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await rejectInviteCall(token);
      setIsRejected(true);
    } catch (err) {
      setActionError(err.message || 'Не удалось отклонить запись.');
    } finally {
      setIsSubmitting(false);
    }
  }, [token]);

  return {
    inviteData,
    loading,
    error,
    isExpired,
    isAccepted,
    isRejected,
    isSubmitting,
    actionError,
    approve,
    reject,
  };
}
