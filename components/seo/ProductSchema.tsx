"use client";

import { useEffect } from "react";

interface ProductSchemaProps {
  product: {
    id: number;
    title: string;
    description: string | null;
    price: number;
    images: string[];
    stock: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: {
      name: string;
      slug: string;
    } | null;
  };
  siteUrl: string;
  currency?: string;
}

export default function ProductSchema({ product, siteUrl, currency = "IRR" }: ProductSchemaProps) {
  useEffect(() => {
    // Build the JSON-LD schema
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.title,
      "description": product.description || product.title,
      "image": product.images.length > 0 ? product.images : undefined,
      "sku": `SKU-${product.id}`,
      "productId": product.id.toString(),
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": currency,
        "availability": product.stock > 0 && product.isActive
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
      },
      "url": `${siteUrl}/product/${product.id}`,
      "mainEntityOfPage": `${siteUrl}/product/${product.id}`,
    };

    // Add category if exists
    if (product.category) {
      Object.assign(schema, {
        "category": product.category.name,
      });
    }

    // Add brand (default if not specified)
    Object.assign(schema, {
      "brand": {
        "@type": "Brand",
        "name": "Vape Store",
      },
    });

    // Create or update script tag
    let scriptTag = document.querySelector('#product-schema') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'product-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);
  }, [product, siteUrl, currency]);

  return null;
}