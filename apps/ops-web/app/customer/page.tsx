"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useCart } from "../../lib/cart-context";
import { formatPrice } from "../../lib/format";
import { products, type Product } from "../../lib/products";

export default function HomePage() {
  const { addItem, items } = useCart();
  const [toast, setToast] = useState<string | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    apiFetch("/catalog/products")
      .then((list: any[]) => {
        const nameMap: Record<string, string> = {
          "Sut 1L": "Süt 1L",
          "Su 1.5L": "Su 1.5L"
        };
        const imageMap: Record<string, string> = {
          "Sut 1L": "/images/milk.svg",
          "Su 1.5L": "/images/water.svg"
        };
        const mapped = list.map((item) => ({
          id: item.id,
          name: nameMap[item.name] || item.name,
          price: Number(item.price || 0),
          image: imageMap[item.name] || "/images/pizza.svg"
        }));
        const pizza = products.find((p) => p.id === "pizza_margherita");
        const merged = new Map<string, Product>();
        if (pizza) merged.set(pizza.id, pizza);
        mapped.forEach((product: Product) => merged.set(product.id, product));
        setProductList(Array.from(merged.values()));
      })
      .catch(() => {
        setProductList(products);
      });
  }, []);

  function handleAdd(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addItem({
      product_id: product.id,
      name: product.name,
      unit_price: product.price,
      image: product.image
    });
    setToast("Ürün sepete eklendi");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Ürünler</h1>
          <div className="text-sm text-gray-500">Hızlı teslimat, sıcak servis.</div>
        </div>
        <Link href="/customer/sepet" className="px-3 py-2 text-sm bg-black text-white rounded">
          Sepetim ({itemCount})
        </Link>
      </div>

      {toast && (
        <div className="mb-4 rounded bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
          {toast}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {productList.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="relative h-40 bg-gray-50">
              <Image src={product.image} alt={product.name} fill className="object-contain p-4" />
            </div>
            <div className="p-4 space-y-2">
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">{formatPrice(product.price)}</div>
              <button
                className="w-full mt-2 px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                onClick={() => handleAdd(product.id)}
              >
                Sepete Ekle
              </button>
            </div>
          </div>
        ))}
        {!productList.length && (
          <div className="text-sm text-gray-500">Ürün bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
