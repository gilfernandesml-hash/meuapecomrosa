import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "#173F35", color: "#FFFDF7", fontSize: 30, fontWeight: 800, border: "4px solid #D2AD5C" }}>R</div>, size); }
