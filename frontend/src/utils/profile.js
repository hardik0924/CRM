import { orgRoleLabel } from './modules';

export const AVATAR_COLORS = {
  navy: '#00255A',
  blue: '#0069C8',
  slate: '#52607A',
};

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'US';

export const avatarColorHex = (color) => AVATAR_COLORS[color] || AVATAR_COLORS.blue;

export const readProfile = () => ({
  name: read('vsph_user_name', 'CRM user'),
  email: read('vsph_user_email', ''),
  roleLabel: orgRoleLabel(read('vsph_org_role', '') || undefined),
  about: read('vsph_profile_about', ''),
  timezone: read('vsph_profile_timezone', 'Asia/Kolkata'),
  color: read('vsph_avatar_color', 'blue'),
});

export const saveProfile = ({ name, about, timezone, color }) => {
  localStorage.setItem('vsph_user_name', name);
  localStorage.setItem('vsph_profile_about', about);
  localStorage.setItem('vsph_profile_timezone', timezone);
  localStorage.setItem('vsph_avatar_color', color);
  window.dispatchEvent(new Event('vsph-profile-updated'));
};
