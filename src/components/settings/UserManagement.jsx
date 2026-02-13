import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function UserManagement() {
  const { t } = useTranslation('settings');
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch('/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data || []);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || t('userManagement.errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(t('userManagement.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      setActionLoading((prev) => ({ ...prev, [`role-${userId}`]: true }));
      const response = await authenticatedFetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        setSuccessMessage(
          t('userManagement.success.roleChanged', { role: t(`userManagement.roles.${newRole}`) })
        );
        await fetchUsers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || t('userManagement.errors.roleChangeFailed'));
      }
    } catch (err) {
      console.error('Error toggling role:', err);
      setError(t('userManagement.errors.roleChangeFailed'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`role-${userId}`]: false }));
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`active-${userId}`]: true }));
      if (isActive) {
        // Deactivate user
        const response = await authenticatedFetch(`/api/auth/users/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setSuccessMessage(t('userManagement.success.userDeactivated'));
          await fetchUsers();
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || t('userManagement.errors.deactivateFailed'));
        }
      } else {
        // Reactivate user - use PUT to role endpoint to restore with current role
        const response = await authenticatedFetch(`/api/auth/users/${userId}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role: 'user', is_active: true }),
        });
        if (response.ok) {
          setSuccessMessage(t('userManagement.success.userReactivated'));
          await fetchUsers();
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || t('userManagement.errors.reactivateFailed'));
        }
      }
    } catch (err) {
      console.error('Error toggling user active status:', err);
      setError(t('userManagement.errors.toggleActiveFailed'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`active-${userId}`]: false }));
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      setError(null);
      const response = await authenticatedFetch('/api/auth/invite', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });
      if (response.ok) {
        setSuccessMessage(t('userManagement.success.userInvited'));
        setShowInviteForm(false);
        setInviteData({ username: '', password: '', role: 'user' });
        await fetchUsers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || t('userManagement.errors.inviteFailed'));
      }
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(t('userManagement.errors.inviteFailed'));
    } finally {
      setInviteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const isSelf = (userId) => {
    return currentUser?.id === userId || currentUser?.username === users.find(u => u.id === userId)?.username;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t('userManagement.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-foreground">
              {t('userManagement.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('userManagement.description')}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('userManagement.inviteUser')}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Invite User Form */}
      {showInviteForm && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-foreground">
              {t('userManagement.inviteFormTitle')}
            </h4>
            <button
              onClick={() => {
                setShowInviteForm(false);
                setInviteData({ username: '', password: '', role: 'user' });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleInviteUser} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('userManagement.fields.username')}
              </label>
              <Input
                value={inviteData.username}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder={t('userManagement.placeholders.username')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('userManagement.fields.password')}
              </label>
              <Input
                type="password"
                value={inviteData.password}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={t('userManagement.placeholders.password')}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('userManagement.fields.role')}
              </label>
              <select
                value={inviteData.role}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="user">{t('userManagement.roles.user')}</option>
                <option value="admin">{t('userManagement.roles.admin')}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteData({ username: '', password: '', role: 'user' });
                }}
              >
                {t('userManagement.actions.cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={inviteLoading || !inviteData.username || !inviteData.password}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {inviteLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('userManagement.actions.inviting')}
                  </div>
                ) : (
                  t('userManagement.actions.invite')
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('userManagement.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-gray-50 dark:bg-gray-900/50 border rounded-lg p-4 ${
                user.is_active === false || user.is_active === 0
                  ? 'border-gray-300 dark:border-gray-600 opacity-60'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">
                        {user.username}
                      </span>
                      <Badge
                        className={
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }
                      >
                        {user.role === 'admin' ? (
                          <Shield className="w-3 h-3 mr-1" />
                        ) : null}
                        {t(`userManagement.roles.${user.role || 'user'}`)}
                      </Badge>
                      {(user.is_active === false || user.is_active === 0) && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {t('userManagement.status.inactive')}
                        </Badge>
                      )}
                      {isSelf(user.id) && (
                        <Badge
                          variant="outline"
                          className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                        >
                          {t('userManagement.status.you')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {t('userManagement.fields.createdAt')}: {formatDate(user.created_at)}
                      </span>
                      <span>
                        {t('userManagement.fields.lastLogin')}: {formatDate(user.last_login)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {/* Toggle Role */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSelf(user.id) || actionLoading[`role-${user.id}`]}
                    onClick={() => handleToggleRole(user.id, user.role)}
                    title={
                      user.role === 'admin'
                        ? t('userManagement.actions.demoteToUser')
                        : t('userManagement.actions.promoteToAdmin')
                    }
                    className="text-xs"
                  >
                    {actionLoading[`role-${user.id}`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : user.role === 'admin' ? (
                      <>
                        <ShieldOff className="w-3 h-3 mr-1" />
                        {t('userManagement.actions.demoteToUser')}
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        {t('userManagement.actions.promoteToAdmin')}
                      </>
                    )}
                  </Button>

                  {/* Toggle Active */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSelf(user.id) || actionLoading[`active-${user.id}`]}
                    onClick={() =>
                      handleToggleActive(user.id, user.is_active !== false && user.is_active !== 0)
                    }
                    title={
                      user.is_active === false || user.is_active === 0
                        ? t('userManagement.actions.reactivate')
                        : t('userManagement.actions.deactivate')
                    }
                    className={`text-xs ${
                      user.is_active === false || user.is_active === 0
                        ? 'text-green-600 hover:text-green-700 border-green-300 dark:border-green-700'
                        : 'text-red-600 hover:text-red-700 border-red-300 dark:border-red-700'
                    }`}
                  >
                    {actionLoading[`active-${user.id}`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : user.is_active === false || user.is_active === 0 ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        {t('userManagement.actions.reactivate')}
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3 mr-1" />
                        {t('userManagement.actions.deactivate')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
