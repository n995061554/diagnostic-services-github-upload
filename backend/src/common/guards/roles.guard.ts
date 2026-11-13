// ============================================================================
// A2Z DIAGNOSTICS ENTERPRISE PLATFORM - NESTJS BACKEND
// Roles & Permissions Decorators and Guards
// ============================================================================

import { SetMetadata, createParamDecorator, ExecutionContext, Injectable, CanActivate, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRole, JwtPayload } from '../enums/role.enum';
import { Reflector } from '@nestjs/core';

// --- DECORATORS ---
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);

// --- GUARDS ---

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admin has universal access
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role) || 
      (user.roles && user.roles.some((r: UserRole) => requiredRoles.includes(r)));

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Requires one of roles: [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
