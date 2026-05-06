import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fde2e6, #ffe5d0 50%, #dceeff)",
          fontSize: 120,
        }}
      >
        🍼
      </div>
    ),
    size,
  );
}
