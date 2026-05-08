import { ShapeType } from "@/types/nexus";

interface Point {
  x: number;
  y: number;
}

export function recognizeShape(points: Point[]): { type: ShapeType; x: number; y: number; width: number; height: number } | null {
  if (points.length < 10) return null; // Too few points to recognize

  // 1. Calculate Bounding Box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  if (width < 20 || height < 20) return null; // Too small

  // 2. Check for Circle
  // Calculate average radius and variance
  const radii: number[] = points.map(p => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length;
  const stdDev = Math.sqrt(variance);

  // If standard deviation is low relative to average radius, it's a circle/ellipse
  if (stdDev / avgRadius < 0.15) {
    return { type: 'circle', x: minX, y: minY, width, height };
  }

  // 3. Check for Square/Rectangle
  // Simple check: how many points are near the edges of the bounding box
  const threshold = Math.min(width, height) * 0.15;
  let edgePoints = 0;
  points.forEach(p => {
    const nearLeft = Math.abs(p.x - minX) < threshold;
    const nearRight = Math.abs(p.x - maxX) < threshold;
    const nearTop = Math.abs(p.y - minY) < threshold;
    const nearBottom = Math.abs(p.y - maxY) < threshold;
    if (nearLeft || nearRight || nearTop || nearBottom) edgePoints++;
  });

  if (edgePoints / points.length > 0.8) {
    return { type: 'rectangle', x: minX, y: minY, width, height };
  }

  // 4. Check for Diamond (slanted lines)
  // Check if points are near the diamond perimeter
  let diamondPoints = 0;
  points.forEach(p => {
    const normalizedX = (p.x - centerX) / (width / 2);
    const normalizedY = (p.y - centerY) / (height / 2);
    const dist = Math.abs(normalizedX) + Math.abs(normalizedY);
    if (Math.abs(dist - 1) < 0.2) diamondPoints++;
  });

  if (diamondPoints / points.length > 0.7) {
    return { type: 'diamond', x: minX, y: minY, width, height };
  }

  return null;
}
