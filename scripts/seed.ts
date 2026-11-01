/**
 * Seed vía service role.
 * Uso: copia .env.local y ejecuta `npm run seed`
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Ejecutando seed...");

  const { error: cfgErr } = await supabase.from("configuracion_sitio").upsert({
    id: 1,
    nombre_negocio: "Catálogo Ventas",
    whatsapp: "5215512345678",
    mensaje_whatsapp: "Hola, vi su catálogo y me interesa un producto",
    direccion: "Av. Reforma 123, Col. Centro, CDMX",
    maps_embed_url:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.5!2d-99.1332!3d19.4326!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDI1JzU3LjQiTiA5OcKwMDcnNTkuNSJX!5e0!3m2!1ses!2smx!4v1",
    horarios: "Lun–Vie 9:00–18:00 · Sáb 10:00–14:00",
    datos_bancarios:
      "Banco: BBVA\nTitular: Catálogo Ventas SA de CV\nCLABE: 012345678901234567\nCuenta: 1234567890\nConcepto: tu código de pedido",
    link_pago_activo: false,
  });
  if (cfgErr) throw cfgErr;

  const categorias = [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      nombre: "Electrónica",
      slug: "electronica",
      orden: 1,
      activa: true,
    },
    {
      id: "a1000000-0000-4000-8000-000000000002",
      nombre: "Hogar",
      slug: "hogar",
      orden: 2,
      activa: true,
    },
    {
      id: "a1000000-0000-4000-8000-000000000003",
      nombre: "Moda",
      slug: "moda",
      orden: 3,
      activa: true,
    },
  ];

  const { error: catErr } = await supabase
    .from("categorias")
    .upsert(categorias);
  if (catErr) throw catErr;

  const subcategorias = [
    {
      id: "b1000000-0000-4000-8000-000000000001",
      categoria_id: categorias[0].id,
      nombre: "Audio",
      slug: "audio",
      orden: 1,
      activa: true,
    },
    {
      id: "b1000000-0000-4000-8000-000000000002",
      categoria_id: categorias[0].id,
      nombre: "Accesorios",
      slug: "accesorios",
      orden: 2,
      activa: true,
    },
    {
      id: "b1000000-0000-4000-8000-000000000003",
      categoria_id: categorias[1].id,
      nombre: "Cocina",
      slug: "cocina",
      orden: 1,
      activa: true,
    },
    {
      id: "b1000000-0000-4000-8000-000000000004",
      categoria_id: categorias[1].id,
      nombre: "Decoración",
      slug: "decoracion",
      orden: 2,
      activa: true,
    },
    {
      id: "b1000000-0000-4000-8000-000000000005",
      categoria_id: categorias[2].id,
      nombre: "Hombre",
      slug: "hombre",
      orden: 1,
      activa: true,
    },
    {
      id: "b1000000-0000-4000-8000-000000000006",
      categoria_id: categorias[2].id,
      nombre: "Mujer",
      slug: "mujer",
      orden: 2,
      activa: true,
    },
  ];
  const { error: subErr } = await supabase
    .from("subcategorias")
    .upsert(subcategorias);
  if (subErr) throw subErr;

  const productos = [
    {
      id: "c1000000-0000-4000-8000-000000000001",
      nombre: "Audífonos Bluetooth Pro",
      slug: "audifonos-bluetooth-pro",
      descripcion:
        "Audífonos inalámbricos con cancelación de ruido y 30 h de batería.",
      precio: 1299,
      stock: 25,
      categoria_id: categorias[0].id,
      subcategoria_id: subcategorias[0].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000002",
      nombre: "Bocina Portátil Waterproof",
      slug: "bocina-portatil-waterproof",
      descripcion: "Bocina resistente al agua IPX7, ideal para exteriores.",
      precio: 899,
      stock: 40,
      categoria_id: categorias[0].id,
      subcategoria_id: subcategorias[0].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000003",
      nombre: "Cargador Rápido USB-C 65W",
      slug: "cargador-rapido-usbc-65w",
      descripcion: "Cargador GaN compatible con laptops y smartphones.",
      precio: 449,
      stock: 60,
      categoria_id: categorias[0].id,
      subcategoria_id: subcategorias[1].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000004",
      nombre: "Soporte Magnético para Auto",
      slug: "soporte-magnetico-auto",
      descripcion: "Soporte con imán de neodimio y rotación 360°.",
      precio: 299,
      stock: 80,
      categoria_id: categorias[0].id,
      subcategoria_id: subcategorias[1].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000005",
      nombre: "Set de Sartenes Antiadherentes",
      slug: "set-sartenes-antiadherentes",
      descripcion: "Juego de 3 sartenes con revestimiento cerámico.",
      precio: 1599,
      stock: 15,
      categoria_id: categorias[1].id,
      subcategoria_id: subcategorias[2].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1556911220-bff31c875dbb?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000006",
      nombre: "Licuadora de Alta Potencia",
      slug: "licuadora-alta-potencia",
      descripcion: "1200 W, vaso de vidrio de 1.5 L y 6 velocidades.",
      precio: 1899,
      stock: 12,
      categoria_id: categorias[1].id,
      subcategoria_id: subcategorias[2].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000007",
      nombre: "Lámpara de Mesa LED",
      slug: "lampara-mesa-led",
      descripcion: "Luz cálida regulable con puerto USB de carga.",
      precio: 649,
      stock: 30,
      categoria_id: categorias[1].id,
      subcategoria_id: subcategorias[3].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000008",
      nombre: "Cojín Decorativo Lino",
      slug: "cojin-decorativo-lino",
      descripcion: "Fundas de lino 45×45 cm, varios colores.",
      precio: 349,
      stock: 50,
      categoria_id: categorias[1].id,
      subcategoria_id: subcategorias[3].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000009",
      nombre: "Camisa Oxford Clásica",
      slug: "camisa-oxford-clasica",
      descripcion: "Camisa de algodón 100%, corte regular.",
      precio: 799,
      stock: 35,
      categoria_id: categorias[2].id,
      subcategoria_id: subcategorias[4].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    },
    {
      id: "c1000000-0000-4000-8000-000000000010",
      nombre: "Blusa de Seda Natural",
      slug: "blusa-seda-natural",
      descripcion: "Blusa ligera de seda, ideal para oficina o evento.",
      precio: 1199,
      stock: 20,
      categoria_id: categorias[2].id,
      subcategoria_id: subcategorias[5].id,
      disponible: true,
      activo: true,
      imagen:
        "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800",
    },
  ];

  for (const p of productos) {
    const { imagen, ...row } = p;
    const { error } = await supabase.from("productos").upsert(row);
    if (error) throw error;

    const { data: existing } = await supabase
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", p.id)
      .eq("es_principal", true)
      .maybeSingle();

    if (!existing) {
      const { error: imgErr } = await supabase.from("producto_imagenes").insert({
        producto_id: p.id,
        url: imagen,
        orden: 0,
        es_principal: true,
      });
      if (imgErr) throw imgErr;
    }
  }

  console.log("Seed completado: 3 categorías, 6 subcategorías, 10 productos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
