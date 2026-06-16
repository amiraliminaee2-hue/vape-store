interface Props {
  status: string;
}

const steps = [
  {
    key: "REGISTERED",
    label: "ثبت سفارش",
  },
  {
    key: "PAYED",
    label: "پرداخت",
  },
  {
    key: "PROCESSING",
    label: "پردازش",
  },
  {
    key: "SHIPPING",
    label: "آماده ارسال",
  },
  {
    key: "SHIPPED",
    label: "ارسال شده",
  },
];

export default function OrderTimeline({
  status,
}: Props) {
  const currentIndex =
    steps.findIndex(
      (step) => step.key === status
    );

  return (
    <div className="mb-10">
      <div className="flex justify-between gap-2">
        {steps.map((step, index) => {
          const active =
            index <= currentIndex;

          return (
            <div
              key={step.key}
              className="
                flex-1
                flex
                flex-col
                items-center
              "
            >
              <div
                className={`
                  w-12
                  h-12
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-sm
                  font-bold
                  transition-all

                  ${
                    active
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-500"
                  }
                `}
              >
                {active ? "✓" : index + 1}
              </div>

              <p
                className={`
                  mt-3
                  text-sm
                  text-center

                  ${
                    active
                      ? "text-white"
                      : "text-zinc-500"
                  }
                `}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}