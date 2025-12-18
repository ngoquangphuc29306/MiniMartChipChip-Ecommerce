import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const StarRating = ({ rating = 5, totalStars = 5, className }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>

      {/* ⭐ Sao đầy */}
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400 fill-yellow-400"
        />
      ))}

      {/* ⭐ Sao nửa */}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          {/* Phần vàng (nửa trái) */}
          <Star
            className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute left-0 top-0"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
          {/* Phần viền xám (nửa phải) */}
          <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
        </div>
      )}

      {/* ⭐ Sao rỗng */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300 fill-gray-300"
        />
      ))}

    </div>
  );
};

export default StarRating;