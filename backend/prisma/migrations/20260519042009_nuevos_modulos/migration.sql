-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'COTIZACION', 'NEGOCIACION', 'GANADO', 'PERDIDO', 'SIN_RESPONDER');

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "origen" TEXT,
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "asesorId" INTEGER,
    "sucursalId" INTEGER,
    "notas" TEXT,
    "valorEstimado" DECIMAL(65,30),
    "conversando" BOOLEAN NOT NULL DEFAULT false,
    "conversandoStoppedAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_crm" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "contenido" TEXT NOT NULL,
    "entrante" BOOLEAN NOT NULL DEFAULT true,
    "waMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_crm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_crm" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_crm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_crm" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "variables" TEXT,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "favorita" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_crm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_rapidos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_rapidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_comerciales" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER,
    "respuestas" JSONB NOT NULL,
    "puntaje" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'Sin diagnosticar',
    "mejoraPct" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_comerciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER,
    "empleadoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "metaValor" DECIMAL(65,30) NOT NULL,
    "realValor" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mensajes_crm_waMessageId_key" ON "mensajes_crm"("waMessageId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_crm" ADD CONSTRAINT "mensajes_crm_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_crm" ADD CONSTRAINT "actividades_crm_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_comerciales" ADD CONSTRAINT "diagnosticos_comerciales_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
