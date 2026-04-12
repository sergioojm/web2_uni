import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import {
  encrypt,
  compare,
  generateVerificationCode
} from '../utils/handlePassword.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/handleJwt.js';
import { notifier } from '../services/notification.service.js';

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user)
});

// POST /api/user/register
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing && existing.status === 'verified') {
      throw AppError.conflict('Email ya registrado');
    }
    if (existing) {
      await User.deleteOne({ _id: existing._id });
    }

    const hashed = await encrypt(password);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
      email,
      password: hashed,
      verificationCode,
      verificationAttempts: 3
    });

    const { accessToken, refreshToken } = issueTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    notifier.emit('user:registered', { user });

    res.status(201).json({
      message: 'Usuario registrado',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          status: user.status,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/validation
export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select(
      '+verificationCode verificationAttempts status'
    );
    if (!user) throw AppError.notFound('Usuario no encontrado');

    if (user.status === 'verified') {
      return res.json({ message: 'Email ya verificado' });
    }

    if (user.verificationAttempts <= 0) {
      throw AppError.tooMany('Se agotaron los intentos de verificación');
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      if (user.verificationAttempts <= 0) {
        throw AppError.tooMany('Se agotaron los intentos de verificación');
      }
      throw AppError.badRequest(
        `Código inválido. Intentos restantes: ${user.verificationAttempts}`
      );
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    notifier.emit('user:verified', { user });

    res.json({
      message: 'Email verificado correctamente',
      data: { status: user.status }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deleted: false }).select(
      '+password'
    );
    if (!user) throw AppError.unauthorized('Credenciales inválidas');

    const ok = await compare(password, user.password);
    if (!ok) throw AppError.unauthorized('Credenciales inválidas');

    const { accessToken, refreshToken } = issueTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login correcto',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/register  (onboarding datos personales)
export const onboardingPersonal = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif },
      { new: true, runValidators: true }
    );
    res.json({ message: 'Datos personales actualizados', data: { user } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/company (onboarding compañía)
export const onboardingCompany = async (req, res, next) => {
  try {
    const body = req.body;
    const me = await User.findById(req.user._id);
    if (!me) throw AppError.notFound('Usuario no encontrado');

    let cif;
    let companyData;

    if (body.isFreelance) {
      if (!me.nif) {
        throw AppError.badRequest(
          'Debes completar tus datos personales antes de marcarte como autónomo'
        );
      }
      cif = me.nif;
      companyData = {
        name: `${me.name} ${me.lastName}`.trim() || me.email,
        cif,
        address: me.address?.toObject ? me.address.toObject() : me.address,
        isFreelance: true
      };
    } else {
      cif = body.cif;
      companyData = {
        name: body.name,
        cif,
        address: body.address || {},
        isFreelance: false
      };
    }

    let company = await Company.findOne({ cif, deleted: false });

    if (!company) {
      company = await Company.create({ ...companyData, owner: me._id });
      me.role = 'admin';
    } else {
      me.role = 'guest';
    }

    me.company = company._id;
    await me.save();

    res.json({
      message: 'Compañía asignada',
      data: { user: me, company }
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/logo
export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('Falta el archivo "logo"');
    if (!req.user.company) {
      throw AppError.badRequest('El usuario no tiene compañía asociada');
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const company = await Company.findOneAndUpdate(
      { _id: req.user.company, deleted: false },
      { logo: logoUrl },
      { new: true }
    );
    if (!company) throw AppError.notFound('Compañía no encontrada');

    res.json({ message: 'Logo actualizado', data: { company } });
  } catch (err) {
    next(err);
  }
};

// GET /api/user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.user._id,
      deleted: false
    }).populate({ path: 'company', match: { deleted: false } });
    if (!user) throw AppError.notFound('Usuario no encontrado');
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/refresh
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await User.findOne({
      _id: payload._id,
      deleted: false
    }).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw AppError.unauthorized('Refresh token inválido');
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      message: 'Token renovado',
      data: { accessToken, refreshToken: newRefreshToken }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/logout
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/user?soft=true
export const remove = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';
    if (soft) {
      await User.findByIdAndUpdate(req.user._id, {
        deleted: true,
        refreshToken: null
      });
    } else {
      await User.deleteOne({ _id: req.user._id });
    }
    notifier.emit('user:deleted', { user: req.user, soft });
    res.json({
      message: soft ? 'Usuario soft-deleted' : 'Usuario eliminado'
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const ok = await compare(currentPassword, user.password);
    if (!ok) throw AppError.unauthorized('Contraseña actual incorrecta');

    user.password = await encrypt(newPassword);
    await user.save();

    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/invite
export const invite = async (req, res, next) => {
  try {
    if (!req.user.company) {
      throw AppError.badRequest('No tienes una compañía asociada');
    }
    const { email, name, lastName, nif, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw AppError.conflict('Email ya registrado');

    const tempPassword = password || generateVerificationCode() + 'Aa!';
    const hashed = await encrypt(tempPassword);

    const invited = await User.create({
      email,
      password: hashed,
      name,
      lastName,
      nif,
      role: 'guest',
      status: 'pending',
      verificationCode: generateVerificationCode(),
      company: req.user.company
    });

    notifier.emit('user:invited', {
      user: invited,
      invitedBy: req.user._id
    });

    res.status(201).json({
      message: 'Usuario invitado',
      data: {
        user: invited,
        tempPassword: password ? undefined : tempPassword
      }
    });
  } catch (err) {
    next(err);
  }
};
