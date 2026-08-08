import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "#123047", color: "#FAF7F2", fontSize: 30, fontWeight: 800, border: "4px solid #C8A96B" }}>R</div>, size); }
