/**
 * Generador de plan de comidas.
 *
 * Reparte las calorías del día entre las comidas y llena cada una eligiendo un
 * alimento por rol. El orden en que se resuelve no es caprichoso:
 *
 *   1. Proteína primero. Es el macro con objetivo más rígido y el que menos
 *      conviene dejar librado a lo que sobre.
 *   2. Grasa después, que tiene mínimo por salud hormonal.
 *   3. Los carbohidratos se quedan con el resto: son el macro que se puede
 *      estirar o achicar sin consecuencias.
 *
 * El resultado es un punto de partida editable, no una receta cerrada: se
 * carga al día y después se cambia lo que haga falta.
 */

/** Clasifica un alimento por lo que aporta, no por lo que es. */
export function rolDe(a) {
  const kcal = Number(a.kcal_100) || 1;
  const prot = Number(a.prot_100) || 0;
  const carb = Number(a.carb_100) || 0;
  const gras = Number(a.gras_100) || 0;

  if (["bebidas", "dulces", "suplementos"].includes(a.categoria)) return "otro";
  // Las legumbres juegan de proteína cuando la tienen; si no, de carbohidrato.
  if (a.categoria === "legumbres") return prot >= 8 ? "proteina" : "carbo";
  // Papa, batata y choclo son verduras en la verdulería y carbohidrato en el plato.
  if (a.categoria === "verduras") return carb >= 15 ? "carbo" : "verdura";
  if (a.categoria === "frutas") return "fruta";
  if (a.categoria === "grasas" || a.categoria === "frutos_secos") return "grasa";

  if ((prot * 4) / kcal >= 0.35 && prot >= 9) return "proteina";
  if ((gras * 9) / kcal >= 0.55) return "grasa";
  if (carb >= 20) return "carbo";
  return "otro";
}

/** Reparto de las calorías del día. Suma 1 en cada caso. */
const REPARTOS = {
  3: [
    ["desayuno", 0.28],
    ["almuerzo", 0.38],
    ["cena", 0.34],
  ],
  4: [
    ["desayuno", 0.25],
    ["almuerzo", 0.35],
    ["merienda", 0.1],
    ["cena", 0.3],
  ],
  5: [
    ["desayuno", 0.22],
    ["almuerzo", 0.32],
    ["merienda", 0.12],
    ["cena", 0.26],
    ["snack", 0.08],
  ],
};

/**
 * Qué alimentos se prefieren en cada momento, en orden. No es nutrición: es
 * que nadie desayuna un bife con ensalada. Si ninguno está en el catálogo, se
 * cae al primer alimento del rol que corresponda.
 */
const PREFERENCIAS = {
  desayuno: {
    proteina: ["Yogur griego", "Huevo entero", "Clara de huevo", "Queso untable light", "Proteina de suero (whey)"],
    carbo: ["Avena", "Pan integral", "Pan lactal integral", "Galletas de arroz"],
    grasa: ["Mantequilla de mani", "Palta", "Almendras", "Nueces"],
    fruta: ["Banana", "Frutilla", "Manzana"],
  },
  merienda: {
    proteina: ["Yogur griego", "Yogur descremado", "Queso port salut", "Proteina de suero (whey)"],
    fruta: ["Manzana", "Banana", "Mandarina", "Pera"],
    grasa: ["Almendras", "Nueces", "Mani"],
  },
  snack: {
    proteina: ["Yogur descremado", "Proteina de suero (whey)"],
    fruta: ["Manzana", "Mandarina", "Pera"],
    grasa: ["Almendras", "Mani"],
  },
  almuerzo: {
    proteina: ["Pechuga de pollo", "Nalga", "Merluza", "Carne picada magra", "Lentejas cocidas", "Huevo entero"],
    carbo: ["Arroz blanco cocido", "Fideos cocidos", "Papa cocida", "Batata", "Quinoa cocida"],
    verdura: ["Brocoli", "Zucchini", "Tomate", "Lechuga", "Zanahoria", "Espinaca"],
    grasa: ["Aceite de oliva", "Palta", "Aceitunas"],
  },
  cena: {
    proteina: ["Merluza", "Pechuga de pollo", "Huevo entero", "Atun al natural", "Peceto"],
    carbo: ["Batata", "Papa cocida", "Arroz integral cocido", "Quinoa cocida"],
    verdura: ["Espinaca", "Brocoli", "Berenjena", "Zapallo", "Tomate"],
    grasa: ["Aceite de oliva", "Palta"],
  },
};

/** Topes por alimento, para que no salgan porciones imposibles de comer. */
const LIMITES = {
  proteina: [20, 350],
  carbo: [20, 400],
  grasa: [5, 60],
  verdura: [100, 250],
  fruta: [50, 200],
};

const acotar = (g, rol) => {
  const [min, max] = LIMITES[rol] ?? [5, 400];
  return Math.round(Math.min(Math.max(g, min), max) / 5) * 5;
};

const redondear = (g) => Math.max(5, Math.round(g / 5) * 5);

function elegir(catalogo, momento, rol, usados) {
  const preferidos = PREFERENCIAS[momento]?.[rol] ?? [];
  for (const nombre of preferidos) {
    const a = catalogo.find((x) => x.nombre === nombre);
    if (a && !usados.has(a.nombre)) return a;
  }
  // Ninguno de los preferidos está o todos salieron ya: se cae al rol.
  const delRol = catalogo.filter((a) => rolDe(a) === rol);
  return delRol.find((a) => !usados.has(a.nombre)) ?? delRol[0] ?? null;
}

function aporta(alimento, gramos) {
  const f = gramos / 100;
  return {
    kcal: (Number(alimento.kcal_100) || 0) * f,
    prot: (Number(alimento.prot_100) || 0) * f,
    carb: (Number(alimento.carb_100) || 0) * f,
    gras: (Number(alimento.gras_100) || 0) * f,
  };
}

function gramosPara(alimento, macro, objetivo) {
  const por100 = Number(alimento[macro + "_100"]) || 0;
  if (por100 <= 0) return null;
  return (objetivo / por100) * 100;
}

/**
 * @param {object} objetivos  salida de calculadora.objetivosDiarios()
 * @param {Array}  catalogo   filas de alimentos_base
 * @param {number} cantidadComidas  3, 4 o 5
 */
export function generarDia(objetivos, catalogo, cantidadComidas = 4) {
  const reparto = REPARTOS[cantidadComidas] ?? REPARTOS[4];
  const usados = new Set();

  const comidas = reparto.map(([momento, proporcion]) =>
    armarComida(momento, catalogo, usados, {
      kcal: objetivos.kcal * proporcion,
      prot: objetivos.prot * proporcion,
      carb: objetivos.carb * proporcion,
      gras: objetivos.gras * proporcion,
    })
  );

  return { comidas, total: totalDe(comidas.flatMap((c) => c.items)), objetivos };
}

function armarComida(momento, catalogo, usados, meta) {
  // Se trabaja con {alimento, gramos} y recién al final se calculan los macros,
  // para poder corregir las cantidades sin rehacer la comida entera.
  const piezas = [];
  const suma = () =>
    piezas.reduce(
      (t, p) => {
        const a = aporta(p.alimento, p.gramos);
        return {
          kcal: t.kcal + a.kcal, prot: t.prot + a.prot,
          carb: t.carb + a.carb, gras: t.gras + a.gras,
        };
      },
      { kcal: 0, prot: 0, carb: 0, gras: 0 }
    );
  const falta = (macro) => meta[macro] - suma()[macro];

  const agregar = (alimento, gramos, rol) => {
    if (!alimento || !(gramos > 0)) return;
    piezas.push({ alimento, gramos: acotar(gramos, rol), rol });
    usados.add(alimento.nombre);
  };

  const esPrincipal = momento === "almuerzo" || momento === "cena";

  // 1. Lo que va con cantidad fija, PRIMERO. La verdura y la fruta también
  //    aportan macros; si se agregaran al final, todo lo demás quedaría
  //    calculado de más. Este era el error que inflaba la proteína.
  if (esPrincipal) {
    agregar(elegir(catalogo, momento, "verdura", usados), 150, "verdura");
  } else if (meta.carb >= 8) {
    // La fruta va en porción habitual, salvo que el objetivo de carbohidratos
    // sea tan bajo que una fruta entera ya se lo lleve todo. En un plan muy
    // bajo en carbos no se tira la fruta: se achica la porción.
    const fruta = elegir(catalogo, momento, "fruta", usados);
    const habitual = fruta?.porcion_g || 120;
    const porCarbos = fruta ? gramosPara(fruta, "carb", meta.carb * 0.6) : null;
    agregar(fruta, porCarbos ? Math.min(habitual, porCarbos) : habitual, "fruta");
  }

  // 2. Proteína: el macro más rígido. Se permiten dos fuentes porque con una
  //    sola no se llega cuando el objetivo es alto: 350 g de yogur griego son
  //    31 g de proteína, y una persona grande en déficit necesita el doble en
  //    esa comida. Un plan de verdad hace lo mismo — yogur y huevos, no un kilo
  //    de yogur.
  for (let i = 0; i < 2 && falta("prot") > 10; i++) {
    const prote = elegir(catalogo, momento, "proteina", usados);
    if (!prote) break;
    const antes = piezas.length;
    agregar(prote, gramosPara(prote, "prot", falta("prot")), "proteina");
    if (piezas.length === antes) break;
  }

  // 3. Grasa: tiene mínimo por salud hormonal, así que va antes que los carbos.
  if (falta("gras") > 2) {
    const grasa = elegir(catalogo, momento, "grasa", usados);
    agregar(grasa, gramosPara(grasa, "gras", falta("gras")), "grasa");
  }

  // 4. Carbohidratos: el relleno. Se permiten dos fuentes porque con una sola
  //    no se llega cuando el objetivo es alto (400 g de arroz cocido son
  //    apenas 112 g de carbohidrato).
  for (let i = 0; i < 2 && falta("carb") > 20; i++) {
    const carbo = elegir(catalogo, momento, "carbo", usados);
    if (!carbo) break;
    const antes = piezas.length;
    agregar(carbo, gramosPara(carbo, "carb", falta("carb")), "carbo");
    if (piezas.length === antes) break;
  }

  // 5. Corrección final. Los pasos anteriores dejan desvío porque cada alimento
  //    aporta de todo, no solo del macro por el que se lo eligió. Se ajustan
  //    los gramos de lo ya elegido: primero la proteína, que manda, y después
  //    los carbohidratos, que absorben el resto.
  ajustar(piezas, "proteina", "prot", falta);
  ajustar(piezas, "carbo", "carb", falta);

  const items = piezas.map((p) => {
    const a = aporta(p.alimento, p.gramos);
    return {
      nombre: p.alimento.nombre,
      alimento_base_id: p.alimento.id,
      gramos: p.gramos,
      kcal: Math.round(a.kcal),
      prot: Math.round(a.prot * 10) / 10,
      carb: Math.round(a.carb * 10) / 10,
      gras: Math.round(a.gras * 10) / 10,
      rol: p.rol,
    };
  });

  return { momento, meta, items, total: totalDe(items) };
}

/** Mueve los gramos del último alimento de ese rol para cerrar el macro. */
function ajustar(piezas, rol, macro, falta) {
  const pieza = [...piezas].reverse().find((p) => p.rol === rol);
  if (!pieza) return;

  const por100 = Number(pieza.alimento[macro + "_100"]) || 0;
  if (por100 <= 0) return;

  const diferencia = falta(macro);
  if (Math.abs(diferencia) < 2) return;

  const nuevos = pieza.gramos + (diferencia / por100) * 100;
  pieza.gramos = acotar(nuevos, rol);
}

export function totalDe(items) {
  return items.reduce(
    (t, i) => ({
      kcal: t.kcal + i.kcal,
      prot: Math.round((t.prot + i.prot) * 10) / 10,
      carb: Math.round((t.carb + i.carb) * 10) / 10,
      gras: Math.round((t.gras + i.gras) * 10) / 10,
    }),
    { kcal: 0, prot: 0, carb: 0, gras: 0 }
  );
}

/** Cuánto se desvió el plan del objetivo, en porcentaje por macro. */
export function desvio(total, objetivos) {
  const p = (real, meta) => (meta ? Math.round(((real - meta) / meta) * 100) : 0);
  return {
    kcal: p(total.kcal, objetivos.kcal),
    prot: p(total.prot, objetivos.prot),
    carb: p(total.carb, objetivos.carb),
    gras: p(total.gras, objetivos.gras),
  };
}
