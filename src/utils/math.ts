import type { Quat, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
export const EPS = 1e-8;

//------------------------------------------------------------------------------
export function clamp(x: number, a: number, b: number) {
    return Math.max(a, Math.min(b, x));
}
export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function scale(v: Vec3, s: number): Vec3 {
    return [v[0] * s, v[1] * s, v[2] * s];
}
export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

//------------------------------------------------------------------------------
// Vec
export function len(v: Vec3) {
    return Math.hypot(v[0], v[1], v[2]);
}
export function norm(v: Vec3): number {
    return Math.hypot(v[0], v[1], v[2]);
}
export function rotateVec3(q: Quat, v: Vec3): Vec3 {
    const rq = quatMul(quatMul(q, [v[0], v[1], v[2], 0]), quatConj(q));
    return [rq[0], rq[1], rq[2]];
}
export function normalizeVec3(v: Vec3): Vec3 {
    const l = len(v);
    return l < EPS ? [0, 0, 0] : [v[0] / l, v[1] / l, v[2] / l];
}
//------------------------------------------------------------------------------
// Quat
export function normalizeQuat(q: Quat): Quat {
    const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}
export function quatConj(q: Quat): Quat {
    return [-q[0], -q[1], -q[2], q[3]];
}
export function quatMul(a: Quat, b: Quat): Quat {
    const [ax, ay, az, aw] = a;
    const [bx, by, bz, bw] = b;
    return [
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ];
}

//------------------------------------------------------------------------------
export function rotateVec3ByQuat(v: Vec3, q: Quat): Vec3 {
    const [vx, vy, vz] = v;
    const [qx, qy, qz, qw] = q;

    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);

    // v' = v + qw * t + cross(q.xyz, t)
    return [vx + qw * tx + (qy * tz - qz * ty), vy + qw * ty + (qz * tx - qx * tz), vz + qw * tz + (qx * ty - qy * tx)];
}
