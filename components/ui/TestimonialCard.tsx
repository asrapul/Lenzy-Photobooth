import Card from "./Card";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card
      variant="cream"
      className="p-6 border border-light/25 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-shadow bg-[#FFFDFB] rounded-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Stars */}
        <div className="flex gap-1 text-primary">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Quote */}
        <p className="font-sans text-body text-neutral-900 leading-relaxed italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-sans text-small font-bold flex items-center justify-center">
          {testimonial.initials}
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-small font-bold text-neutral-900 leading-tight">
            {testimonial.name}
          </span>
          <span className="font-sans text-xs text-neutral-500">
            {testimonial.role}
          </span>
        </div>
      </div>
    </Card>
  );
}
