"use client";

import { useState, useRef } from "react";
import { compressImage } from "@/lib/compressImage";
import { uploadProductImage } from "@/lib/storage";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/FormInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Spinner } from "@/components/ui/Spinner";
import { ImagePlus, X } from "lucide-react";
import { useStorageUrl } from "@/hooks/useStorageUrl";
import type { Product } from "@/lib/types";

interface Category {
  id: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  product_type: "final" | "raw_material";
  category_id: string;
  supplier_id: string;
  unit_of_measure: string;
  purchase_price: string;
  sale_price: string;
  min_stock: string;
  weight: string;
  weight_unit: string;
  units_per_box: string;
  kg_per_box: string;
  image_url: string;
}

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  form: ProductFormData;
  setForm: (form: ProductFormData) => void;
  onSubmit: () => void;
  categories: Category[];
  suppliers: SupplierOption[];
}

export function ProductForm({
  open,
  onClose,
  editingProduct,
  form,
  setForm,
  onSubmit,
  categories,
  suppliers,
}: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = useStorageUrl(form.image_url);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `products/${Date.now()}-${compressed.name}`;
      const { filePath: savedPath, error } = await uploadProductImage(compressed, path);
      if (error) {
        console.error("Upload failed:", error);
      } else if (savedPath) {
        setForm({ ...form, image_url: savedPath });
      }
    } catch (err) {
      console.error("Image compression/upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, image_url: "" });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Imagen del producto
          </label>
          {form.image_url ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Producto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <ImagePlus size={24} />
                  <span className="text-xs">Subir foto</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Max 500KB. Se comprime automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="SKU del producto"
          />
          <FormInput
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre del producto"
          />
        </div>

        <FormTextarea
          label="Descripcion"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripcion del producto"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Tipo de Producto"
            value={form.product_type}
            onChange={(e) =>
              setForm({ ...form, product_type: e.target.value as "final" | "raw_material" })
            }
            options={[
              { value: "final", label: "Producto Final" },
              { value: "raw_material", label: "Materia Prima" },
            ]}
          />
          <SearchableSelect
            label="Categoría"
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            placeholder="Sin categoría"
            searchPlaceholder="Buscar categoría..."
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SearchableSelect
            label="Proveedor"
            value={form.supplier_id}
            onChange={(v) => setForm({ ...form, supplier_id: v })}
            placeholder="Sin proveedor"
            searchPlaceholder="Buscar proveedor..."
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FormSelect
            label="Unidad de Medida"
            value={form.unit_of_measure}
            onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
            options={[
              { value: "unidades", label: "Unidades" },
              { value: "kg", label: "Kg" },
              { value: "litros", label: "Litros" },
              { value: "metros", label: "Metros" },
              { value: "cajas", label: "Cajas" },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormInput
            label="Precio Compra"
            type="number"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
            placeholder="0.00"
          />
          <FormInput
            label="Precio Venta"
            type="number"
            value={form.sale_price}
            onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
            placeholder="0.00"
          />
          <FormInput
            label="Stock Minimo"
            type="number"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            placeholder="0"
          />
        </div>

        {/* Peso y Embalaje */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">Peso y Embalaje</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Peso"
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="0.00"
              />
              <FormSelect
                label="Unidad de Peso"
                value={form.weight_unit}
                onChange={(e) => setForm({ ...form, weight_unit: e.target.value })}
                options={[
                  { value: "gramo", label: "Gramo" },
                  { value: "kg", label: "Kg" },
                  { value: "litro", label: "Litro" },
                  { value: "ml", label: "Ml" },
                  { value: "unidad", label: "Unidad" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Unidades por Caja"
                type="number"
                value={form.units_per_box}
                onChange={(e) => setForm({ ...form, units_per_box: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="Kg por Caja"
                type="number"
                value={form.kg_per_box}
                onChange={(e) => setForm({ ...form, kg_per_box: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!form.name.trim()}>
            {editingProduct ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
