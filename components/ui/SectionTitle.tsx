interface SectionTitleProps {
  title: string;
  description: string;
}

export default function SectionTitle({
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="text-center mb-24">

      <h2
        className="
          text-5xl
          md:text-7xl
          font-bold
          tracking-tight
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-6
          text-zinc-400
          text-lg
          max-w-2xl
          mx-auto
        "
      >
        {description}
      </p>

    </div>
  );
}