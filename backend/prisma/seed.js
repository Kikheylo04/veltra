const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Usuario admin
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@taller.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@taller.com',
      password: adminPass,
      rol: 'ADMIN',
    },
  });

  // Empleado mecánico
  const mecPass = await bcrypt.hash('mec123', 10);
  const mecUsuario = await prisma.usuario.upsert({
    where: { email: 'mecanico@taller.com' },
    update: {},
    create: {
      nombre: 'Juan Pérez',
      email: 'mecanico@taller.com',
      password: mecPass,
      rol: 'MECANICO',
    },
  });

  await prisma.empleado.upsert({
    where: { usuarioId: mecUsuario.id },
    update: {},
    create: {
      usuarioId: mecUsuario.id,
      nombre: 'Juan Pérez',
      especialidad: 'Motor y transmisión',
      telefono: '555-1234',
    },
  });

  // Proveedor
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: 'AutoPartes El Rey',
      telefono: '555-9999',
      correo: 'ventas@autopartesrey.com',
    },
  });

  // Repuestos
  await prisma.repuesto.createMany({
    skipDuplicates: true,
    data: [
      { codigo: 'ACE-5W30', nombre: 'Aceite 5W-30 1L', precioCosto: 8.50, precioVenta: 15.00, stock: 50, stockMinimo: 10, proveedorId: proveedor.id },
      { codigo: 'FIL-ACE-01', nombre: 'Filtro de aceite universal', precioCosto: 5.00, precioVenta: 10.00, stock: 30, stockMinimo: 5, proveedorId: proveedor.id },
      { codigo: 'FIL-AIR-01', nombre: 'Filtro de aire', precioCosto: 7.00, precioVenta: 14.00, stock: 20, stockMinimo: 5, proveedorId: proveedor.id },
      { codigo: 'PAD-DEL-01', nombre: 'Pastillas de freno delanteras', precioCosto: 18.00, precioVenta: 35.00, stock: 15, stockMinimo: 4, proveedorId: proveedor.id },
      { codigo: 'BUJ-NGK-01', nombre: 'Bujías NGK (set x4)', precioCosto: 12.00, precioVenta: 25.00, stock: 25, stockMinimo: 6, proveedorId: proveedor.id },
    ],
  });

  // Cliente de prueba
  const cliente = await prisma.cliente.create({
    data: {
      nombre: 'Carlos Rodríguez',
      telefono: '555-4321',
      correo: 'carlos@email.com',
      direccion: 'Av. Principal 123',
    },
  });

  // Vehículo
  const vehiculo = await prisma.vehiculo.create({
    data: {
      clienteId: cliente.id,
      placa: 'ABC-1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2019,
      color: 'Blanco',
    },
  });

  // Servicios rápidos
  await prisma.servicioRapido.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Cambio de aceite', precio: 25.00 },
      { nombre: 'Alineación', precio: 20.00 },
      { nombre: 'Balanceo', precio: 15.00 },
      { nombre: 'Frenos delanteros', precio: 40.00 },
      { nombre: 'Revisión general', precio: 30.00 },
      { nombre: 'Cambio filtro aire', precio: 18.00 },
      { nombre: 'Diagnóstico electrónico', precio: 35.00 },
      { nombre: 'Lavado motor', precio: 22.00 },
    ],
  });

  // Sucursal principal
  await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nombre: 'Sede Principal', direccion: 'Av. Principal 123', telefono: '555-0000' },
  });

  console.log('✅ Seed completado exitosamente');
  console.log('   Admin: admin@taller.com / admin123');
  console.log('   Mecánico: mecanico@taller.com / mec123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
