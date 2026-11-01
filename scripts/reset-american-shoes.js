/**
 * Limpia datos de prueba y carga American Shoes (SPS) en Lempiras.
 * Uso: node scripts/reset-american-shoes.js
 */
const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:7tLDMJwrNaIXoprw@db.vlgfmiqzeepotipgszrm.supabase.co:5432/postgres";

const MAPS_EMBED =
  "https://www.google.com/maps?q=15.513193,-88.0251794&z=17&output=embed";
const MAPS_LINK = "https://maps.app.goo.gl/3oG4nDYoxioL64ME9";

const IDS = {
  hombre: "d1000000-0000-4000-8000-000000000001",
  mujer: "d1000000-0000-4000-8000-000000000002",
  infantil: "d1000000-0000-4000-8000-000000000003",
  nino: "d2000000-0000-4000-8000-000000000001",
  nina: "d2000000-0000-4000-8000-000000000002",
};

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Limpiando pedidos y catálogo...");
  await client.query("delete from pedido_items");
  await client.query("delete from pedidos");
  await client.query("delete from producto_imagenes");
  await client.query("delete from productos");
  await client.query("delete from subcategorias");
  await client.query("delete from categorias");

  console.log("Actualizando configuración del sitio...");
  await client.query(
    `update configuracion_sitio set
      nombre_negocio = $1,
      logo_url = null,
      whatsapp = $2,
      mensaje_whatsapp = $3,
      direccion = $4,
      maps_embed_url = $5,
      horarios = $6,
      datos_bancarios = $7,
      link_pago_activo = false,
      updated_at = now()
    where id = 1`,
    [
      "American Shoes",
      "50499999999",
      "Hola American Shoes, vi su catálogo y me interesa un par",
      `Outlet Shoes San Pedro Sula\nSan Pedro Sula, Cortés, Honduras\nVer mapa: ${MAPS_LINK}`,
      MAPS_EMBED,
      "Lun–Sáb 9:00–19:00 · Dom 10:00–15:00",
      `Banco: Banpaís / BAC Honduras
Titular: American Shoes — Outlet Shoes San Pedro Sula
Cuenta Lempiras (HNL): (actualizar en panel admin)
Concepto: tu código de pedido
Transferencia en Lempiras (L).`,
    ]
  );

  console.log("Creando categorías...");
  await client.query(
    `insert into categorias (id, nombre, slug, orden, activa) values
      ($1, 'Hombre', 'hombre', 1, true),
      ($2, 'Mujer', 'mujer', 2, true),
      ($3, 'Infantil', 'infantil', 3, true)`,
    [IDS.hombre, IDS.mujer, IDS.infantil]
  );

  console.log("Creando subcategorías Infantil...");
  await client.query(
    `insert into subcategorias (id, categoria_id, nombre, slug, orden, activa) values
      ($1, $3, 'Niño', 'nino', 1, true),
      ($2, $3, 'Niña', 'nina', 2, true)`,
    [IDS.nino, IDS.nina, IDS.infantil]
  );

  const productos = [
    {
      id: "d3000000-0000-4000-8000-000000000001",
      nombre: "Zapato Casual Oxford Hombre",
      slug: "zapato-casual-oxford-hombre",
      descripcion:
        "Zapato oxford de cuero sintético para hombre. Ideal para oficina y uso diario. Outlet San Pedro Sula.",
      precio: 1290,
      stock: 18,
      categoria_id: IDS.hombre,
      subcategoria_id: null,
      imagen:
        "https://images.unsplash.com/photo-1614252231338-cb0b195750f0?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000002",
      nombre: "Tenis Deportivo Hombre Runner",
      slug: "tenis-deportivo-hombre-runner",
      descripcion:
        "Tenis deportivos livianos con suela antideslizante. Perfectos para caminar o entrenamiento.",
      precio: 990,
      stock: 25,
      categoria_id: IDS.hombre,
      subcategoria_id: null,
      imagen:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000003",
      nombre: "Tacón Elegante Mujer",
      slug: "tacon-elegante-mujer",
      descripcion:
        "Tacón medio elegante para ocasiones especiales. Comodidad y estilo American Shoes.",
      precio: 1450,
      stock: 14,
      categoria_id: IDS.mujer,
      subcategoria_id: null,
      imagen:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000004",
      nombre: "Sandalia Plana Mujer",
      slug: "sandalia-plana-mujer",
      descripcion:
        "Sandalia plana cómoda para el día a día. Disponible en varios tonos.",
      precio: 650,
      stock: 30,
      categoria_id: IDS.mujer,
      subcategoria_id: null,
      imagen:
        "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000005",
      nombre: "Tenis Escolar Niño",
      slug: "tenis-escolar-nino",
      descripcion:
        "Tenis resistentes para niño, ideales para la escuela y juegos. Suela flexible.",
      precio: 580,
      stock: 22,
      categoria_id: IDS.infantil,
      subcategoria_id: IDS.nino,
      imagen:
        "https://images.unsplash.com/photo-1514989940723-808ba2819160?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000006",
      nombre: "Zapato Formal Niño",
      slug: "zapato-formal-nino",
      descripcion:
        "Zapato formal para niño, perfecto para eventos y uniforme escolar.",
      precio: 720,
      stock: 16,
      categoria_id: IDS.infantil,
      subcategoria_id: IDS.nino,
      imagen:
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000007",
      nombre: "Ballerina Niña Rosa",
      slug: "ballerina-nina-rosa",
      descripcion:
        "Ballerinas cómodas para niña. Diseño suave y duradero para el día a día.",
      precio: 540,
      stock: 20,
      categoria_id: IDS.infantil,
      subcategoria_id: IDS.nina,
      imagen:
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800",
    },
    {
      id: "d3000000-0000-4000-8000-000000000008",
      nombre: "Sandalia Niña Verano",
      slug: "sandalia-nina-verano",
      descripcion:
        "Sandalia liviana para niña, ideal para clima cálido de San Pedro Sula.",
      precio: 480,
      stock: 24,
      categoria_id: IDS.infantil,
      subcategoria_id: IDS.nina,
      imagen:
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
    },
  ];

  console.log("Insertando zapatos de muestra...");
  for (const p of productos) {
    await client.query(
      `insert into productos (
        id, nombre, slug, descripcion, precio, stock,
        categoria_id, subcategoria_id, disponible, activo
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,true,true)`,
      [
        p.id,
        p.nombre,
        p.slug,
        p.descripcion,
        p.precio,
        p.stock,
        p.categoria_id,
        p.subcategoria_id,
      ]
    );
    await client.query(
      `insert into producto_imagenes (producto_id, url, orden, es_principal)
       values ($1,$2,0,true)`,
      [p.id, p.imagen]
    );
  }

  const summary = await client.query(`
    select
      (select count(*)::int from categorias) as categorias,
      (select count(*)::int from subcategorias) as subcategorias,
      (select count(*)::int from productos) as productos,
      (select count(*)::int from pedidos) as pedidos,
      (select nombre_negocio from configuracion_sitio where id=1) as negocio
  `);

  console.log(JSON.stringify(summary.rows[0], null, 2));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
