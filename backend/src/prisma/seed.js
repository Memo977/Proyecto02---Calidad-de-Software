/**
 * @file src/prisma/seed.js
 * @description Script de inicialización (seed) de la base de datos.
 * Crea los permisos, roles y usuarios por defecto necesarios para que el
 * sistema funcione desde el primer arranque.
 *
 * Usa `upsert` en todos los registros para que sea idempotente:
 * se puede ejecutar múltiples veces sin duplicar datos.
 *
 * Ejecución:
 *   npm run db:seed          (local)
 *   node src/prisma/seed.js  (directo)
 *
 * En Docker se ejecuta automáticamente al inicio del contenedor backend.
 *
 * Roles creados:
 *   - SUPERADMIN  → Acceso total al sistema
 *   - AUDITOR     → Solo lectura (usuarios y productos)
 *   - REGISTRADOR → CRUD de productos, lectura de usuarios
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Lista completa de permisos atómicos del sistema.
 * Cada permiso representa una acción específica que puede asignarse a un rol.
 *
 * @type {string[]}
 */
const PERMISSIONS = [
  'VIEW_USERS', 'CREATE_USER', 'EDIT_USER', 'DELETE_USER',
  'VIEW_PRODUCTS', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT',
  'VIEW_ROLES', 'MANAGE_ROLES',
  'VIEW_AUDIT_LOG',
  'VIEW_REPORTS',
];

/**
 * Mapa de roles y los permisos que se les asignan.
 * SUPERADMIN recibe todos los permisos disponibles.
 *
 * @type {Record<string, string[]>}
 */
const ROLES = {
  SUPERADMIN: [
    'VIEW_USERS', 'CREATE_USER', 'EDIT_USER', 'DELETE_USER',
    'VIEW_PRODUCTS', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT',
    'VIEW_ROLES', 'MANAGE_ROLES',
    'VIEW_AUDIT_LOG',
    'VIEW_REPORTS',
  ],
  AUDITOR: [
    'VIEW_USERS',
    'VIEW_PRODUCTS',
  ],
  REGISTRADOR: [
    'VIEW_USERS',
    'VIEW_PRODUCTS', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT',
  ],
};

/**
 * Función principal del seed.
 * Ejecuta tres pasos en orden:
 *  1. Crea/actualiza todos los permisos
 *  2. Crea/actualiza roles y les asigna sus permisos
 *  3. Crea/actualiza los usuarios por defecto con contraseñas hasheadas (bcrypt, cost 12)
 *
 * @returns {Promise<void>}
 */
async function main() {
  console.log('🌱 Seeding database...');

  // 1. Crear permisos (upsert — seguro de ejecutar múltiples veces)
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Permissions created');

  // 2. Crear roles y asignar sus permisos
  for (const [roleName, permissions] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    // Reemplazar los permisos actuales del rol para garantizar consistencia
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const permName of permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log('✅ Roles and role permissions created');

  // 3. Crear usuarios por defecto con contraseñas hasheadas (RF-02: bcrypt cost=12)
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: passwordHash,
      email: 'superadmin@sistema.com',
      roleId: superAdminRole.id,
    },
  });

  const auditorRole = await prisma.role.findUnique({ where: { name: 'AUDITOR' } });
  const auditorHash = await bcrypt.hash('Auditor1234!', 12);
  await prisma.user.upsert({
    where: { username: 'auditor' },
    update: {},
    create: {
      username: 'auditor',
      password: auditorHash,
      email: 'auditor@sistema.com',
      roleId: auditorRole.id,
    },
  });

  const registradorRole = await prisma.role.findUnique({ where: { name: 'REGISTRADOR' } });
  const registradorHash = await bcrypt.hash('Registrador1234!', 12);
  await prisma.user.upsert({
    where: { username: 'registrador' },
    update: {},
    create: {
      username: 'registrador',
      password: registradorHash,
      email: 'registrador@sistema.com',
      roleId: registradorRole.id,
    },
  });

  console.log('✅ Default users created');
  console.log('');
  console.log('👤 Default credentials:');
  console.log('   SuperAdmin  → username: superadmin   | password: Admin1234!');
  console.log('   Auditor     → username: auditor      | password: Auditor1234!');
  console.log('   Registrador → username: registrador  | password: Registrador1234!');
  console.log('');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
