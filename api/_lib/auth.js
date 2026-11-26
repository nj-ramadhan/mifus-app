import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.development.local', override: true });

export function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new AuthError('JWT_SECRET belum dikonfigurasi di environment server', 500);
  }
  return jwt.sign(
    {
      id: user.id || user.id_user,
      role: user.role,
      hospital_id: user.hospital_id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function verifyToken(req) {
  if (!process.env.JWT_SECRET) {
    throw new AuthError('JWT_SECRET belum dikonfigurasi di environment server', 500);
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AuthError('Token tidak ada', 401);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AuthError('Token tidak valid', 401);
  }
}

export class AuthError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

export function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('Anda tidak punya akses untuk aksi ini', 403);
  }
}

export function assertHospitalScope(user, hospitalId) {
  if (
    ['manager', 'nurse'].includes(user.role) &&
    (!user.hospital_id || !hospitalId || String(user.hospital_id) !== String(hospitalId))
  ) {
    throw new AuthError('Di luar cakupan rumah sakit Anda', 403);
  }
}

export function assertScope(user, targetIdRt, targetIdRw) {
  if (targetIdRt == null && targetIdRw == null) return;
  if (user.role === 'rw_admin' && user.id_rw != null && targetIdRw != null && String(targetIdRw) !== String(user.id_rw)) {
    throw new AuthError('Di luar cakupan RW Anda', 403);
  }
  if (['rt_admin', 'warga'].includes(user.role) && user.id_rt != null && targetIdRt != null && String(targetIdRt) !== String(user.id_rt)) {
    throw new AuthError('Di luar cakupan RT Anda', 403);
  }
}
