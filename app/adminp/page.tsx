'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface IUser {
  _id: string;
  name: string;
  email?: string;
  createdAt?: string;
  lastChatTime?: string;
  totalChats: number;
  totalMessages: number;
  aiResponses: number;
  warnings: number;
  bannedUntil?: string | null;
  hasUnlimitedChats: boolean;
}

interface IEditForm {
  name: string;
  email: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [editForm, setEditForm] = useState<IEditForm>({ name: '', email: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = () => {
    if (adminCode === 'dennis2005') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      toast.success('Welcome, Admin!');
      fetchUsers();
    } else {
      toast.error('Invalid admin code!');
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-admin-code': 'dennis2005'
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, userId: string, extraData?: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': 'dennis2005'
        },
        body: JSON.stringify({ action, userId, userData: extraData })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
        if (action === 'toggleUnlimited') {
          setUsers(users.map(u =>
            u._id === userId ? { ...u, hasUnlimitedChats: data.hasUnlimitedChats } : u
          ));
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleEdit = (user: IUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    await handleAction('edit', editingUser._id, editForm);
    setEditingUser(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    toast.success('Logged out');
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter admin code to access</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter admin code"
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-all shadow-lg border border-gray-700"
            >
              Access Panel
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              DeepChat Admin Panel
            </h1>
            <p className="text-gray-400 mt-1">Manage users and system settings</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchUsers}
              className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-all border border-gray-700"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-gray-300 text-sm mt-1">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold">{users.filter(u => u.hasUnlimitedChats).length}</div>
            <div className="text-gray-300 text-sm mt-1">Unlimited Users</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold">{users.filter(u => u.bannedUntil && new Date(u.bannedUntil) > new Date()).length}</div>
            <div className="text-gray-300 text-sm mt-1">Banned Users</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold">{users.reduce((sum, u) => sum + u.totalChats, 0)}</div>
            <div className="text-gray-300 text-sm mt-1">Total Chats</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name, email, or ID..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">User</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Dates</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Stats</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-700/50 hover:bg-gray-700/20 transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-lg text-white">{user.name}</div>
                          <div className="text-sm text-blue-400 font-medium">{user.email || 'No email'}</div>
                          <div className="text-xs text-gray-500 mt-1">ID: {user._id.substring(0, 12)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-300">
                            <span className="text-gray-500">Created:</span>
                            <div className="text-blue-400 font-semibold">
                              {user.createdAt ? new Date(user.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </div>
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Last Chat:</span>
                            <div className="text-green-400 font-semibold">
                              {user.lastChatTime ? new Date(user.lastChatTime).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Never'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-300">Chats: <span className="text-blue-400 font-semibold">{user.totalChats}</span></div>
                          <div className="text-gray-300">Messages: <span className="text-green-400 font-semibold">{user.totalMessages}</span></div>
                          <div className="text-gray-300">AI Responses: <span className="text-purple-400 font-semibold">{user.aiResponses}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {user.bannedUntil && new Date(user.bannedUntil) > new Date() && (
                            <span className="inline-block bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                              Banned
                            </span>
                          )}
                          {user.hasUnlimitedChats && (
                            <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                              Unlimited
                            </span>
                          )}
                          {user.warnings > 0 && (
                            <span className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                              {user.warnings} Warning{user.warnings > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(user)}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-blue-500/30"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction('toggleUnlimited', user._id)}
                            className={`${
                              user.hasUnlimitedChats
                                ? 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border-orange-500/30'
                                : 'bg-green-600/20 hover:bg-green-600/40 text-green-400 border-green-500/30'
                            } px-3 py-1 rounded-lg text-xs font-semibold transition-all border`}
                          >
                            {user.hasUnlimitedChats ? 'Remove Unlimited' : 'Make Unlimited'}
                          </motion.button>

                          {user.bannedUntil && new Date(user.bannedUntil) > new Date() ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAction('unblock', user._id)}
                              className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-yellow-500/30"
                            >
                              Unblock
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAction('ban', user._id)}
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-red-500/30"
                            >
                              Ban 24h
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction('resetLimit', user._id)}
                            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-purple-500/30"
                          >
                            Reset Limit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (confirm(`Delete user ${user.name}? This action cannot be undone!`)) {
                                handleAction('delete', user._id);
                              }
                            }}
                            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-xs font-semibold transition-all border border-red-500/30"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">Edit User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all"
                  >
                    Save Changes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
