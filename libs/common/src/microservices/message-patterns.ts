export const MESSAGE_PATTERNS = {
  auth: {
    login: 'auth.login',
    validateToken: 'auth.validate_token',
    getMyAccess: 'auth.get_my_access',
    listUserAccess: 'auth.list_user_access',
    updateUserRoles: 'auth.update_user_roles',
  },
  subscriptions: {
    listPlans: 'subscriptions.list_plans',
    findMine: 'subscriptions.find_mine',
    updateMine: 'subscriptions.update_mine',
  },
  interactions: {
    createOrUpdate: 'interactions.create_or_update',
    findSent: 'interactions.find_sent',
  },
  matches: {
    ensurePair: 'matches.ensure_pair',
    findMine: 'matches.find_mine',
    findAccessibleById: 'matches.find_accessible_by_id',
  },
  messages: {
    send: 'messages.send',
    findByMatch: 'messages.find_by_match',
  },
  users: {
    ping: 'users.ping',
    create: 'users.create',
    findAllPublic: 'users.find_all_public',
    findPublicById: 'users.find_public_by_id',
    findAuthByEmail: 'users.find_auth_by_email',
    findAccessById: 'users.find_access_by_id',
    findAllAccess: 'users.find_all_access',
    updateProfile: 'users.update_profile',
    updatePlan: 'users.update_plan',
    updateAccessRoles: 'users.update_access_roles',
  },
} as const;
