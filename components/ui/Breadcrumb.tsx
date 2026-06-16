import Link from "next/link";

interface BreadcrumbProps {
  categoryName: string;
  categorySlug: string;
  productTitle: string;
}

export default function Breadcrumb({
  categoryName,
  categorySlug,
  productTitle,
}: BreadcrumbProps) {
  return (
    <nav
      className="
        flex
        items-center
        gap-2
        text-sm
        text-zinc-400
        mb-8
      "
    >
      <Link
        href="/"
        className="
          hover:text-white
          transition-colors
        "
      >
        خانه
      </Link>

      <span>/</span>

      <Link
        href={`/shop?category=${categorySlug}`}
        className="
          hover:text-white
          transition-colors
        "
      >
        {categoryName}
      </Link>

      <span>/</span>

      <span className="text-white">
        {productTitle}
      </span>
    </nav>
  );
}