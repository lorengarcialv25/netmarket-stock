# Reglas de Importacion - Excel a Base de Datos

## Archivo fuente
`Control de stock almacen.xlsx` - 13 hojas

## Hojas procesadas
1. **Inventario** - Productos (materias primas y productos finales) + stock
2. **Recetas** - Bill of Materials (escandallos)

## Tablas destino
- `products` (111 registros)
- `categories` (7 creadas)
- `warehouses` (1: "Almacen Principal")
- `warehouse_stock` (65 entradas)
- `bill_of_materials` (162 entradas)

---

## Reglas de mapeo de productos

### Tipo de producto (`product_type`)
- **`raw_material`**: Productos de la hoja Inventario que son componentes/materias primas (71 productos, SKU: MP-0001 a MP-0071)
- **`final`**: Productos terminados que se venden (40 productos, SKU del Excel tipo Amazon o generados PT-0072 a PT-0085)

### SKU
- Si el Excel tiene SKU de Amazon (ej: `B0DXXX...`), se usa tal cual
- Si no tiene SKU, se genera automaticamente:
  - Materias primas: `MP-XXXX` (secuencial)
  - Productos finales: `PT-XXXX` (secuencial)

### Categorias (auto-asignadas por nombre)
| Patron en nombre | Categoria |
|---|---|
| `calcio`, `tortugas` | Calcio |
| `blister`, `torre`, `flyer` | Blister |
| `flexivox`, `flexi vox`, `manguera`, `botella`, `tapon` | FlexiVox |
| `peonza`, `arandela`, `bolsa amarilla/roja/verde/naranja` | Peonzas |
| `lapic`, `cera`, `girls`, `tynie` | Lapices y Ceras |
| `packaging`, `pack mix`, `pegatina`, `bolsas algodon` | Packaging |
| `gammarus`, `gusano`, `larva`, `menu`, `sticks`, `shrimp`, `mast`, `fischfit`, `vaso medidor`, `comida` | Alimentacion Animal |

### Unidad de medida (`unit_of_measure`)
- Por defecto: `unidades`
- Productos con peso en nombre (ej: `200g`, `75g`): `kg`
- Mapeo del Excel: si la columna medida dice "gramo"/"kg" -> `kg`, "litro" -> `litros`

### Precios
- `purchase_price`: del Excel si existe, sino `0`
- `sale_price`: del Excel si existe, sino `0`

### Campos de peso/empaquetado
- **`weight`**: valor numerico del Excel. Si es texto como "45-50", se toma el primer numero (45). Si es "?", se pone `NULL`
- **`weight_unit`**: `gramo` por defecto
- **`units_per_box`**: entero del Excel. Si es rango como "400-450", se toma el primer numero (400)
- **`kg_per_box`**: decimal del Excel, `NULL` si no existe

### Stock minimo (`min_stock`)
- Del Excel si existe, sino `0`

---

## Reglas de stock (`warehouse_stock`)

- Solo se insertan productos con stock > 0 en el Excel
- Stock negativo se ajusta a 0: `Math.max(0, stock)`
- Todo el stock va al almacen "Almacen Principal"
- Si un producto tiene stock = 0 o no tiene stock, NO se crea entrada en warehouse_stock

---

## Reglas de BOM / Recetas (`bill_of_materials`)

### Matching de productos
- Se usa matching por nombre case-insensitive: `LOWER(p.name) = LOWER('...')`
- `product_id`: producto final (`product_type = 'final'`)
- `raw_material_id`: materia prima (`product_type = 'raw_material'`)

### Cantidad (`quantity`)
- Tal como aparece en la hoja Recetas del Excel
- Para materias primas medidas en gramos (comida, calcio en polvo), la cantidad es en gramos

### Materiales excluidos
Los siguientes materiales del Excel se omitieron porque no existen en inventario:
- "Pegatina redonda transparente"
- "Codigo de barras pegatina"
- "Desafil"
- Cualquier material con `medida: "No existe"`

### Problemas conocidos con acentos
- El Excel usa `Menu` sin acento, pero las recetas pueden referir `Menu` con/sin acento
- Regla: los nombres en BD se guardaron SIN acentos (ej: `Menu Sticks`, no `Menu Sticks`)
- Al sincronizar, normalizar acentos antes de hacer matching

---

## Proceso de sincronizacion (para futuras cargas)

1. Parsear Excel con libreria `xlsx` (paquete npm)
2. Leer hoja "Inventario" -> extraer productos + stock
3. Crear categorias que no existan
4. Insertar productos con `ON CONFLICT` para evitar duplicados (usar SKU como clave unica)
5. Insertar stock en `warehouse_stock` (solo productos con stock > 0)
6. Leer hoja "Recetas" -> generar INSERTs de BOM con subqueries por nombre
7. Verificar conteos finales

### Orden de insercion (por dependencias FK)
1. `categories` (sin dependencias)
2. `suppliers` (sin dependencias)
3. `warehouses` (sin dependencias)
4. `products` (depende de categories, suppliers)
5. `warehouse_stock` (depende de products, warehouses)
6. `bill_of_materials` (depende de products x2)

---

## Verificacion
```sql
SELECT 'products' as tabla, COUNT(*) FROM public.products
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'warehouses', COUNT(*) FROM public.warehouses
UNION ALL SELECT 'warehouse_stock', COUNT(*) FROM public.warehouse_stock
UNION ALL SELECT 'bill_of_materials', COUNT(*) FROM public.bill_of_materials;
```

Resultado esperado: 111 productos, 8 categorias, 1 almacen, 65 stock entries, 162 BOM entries.
