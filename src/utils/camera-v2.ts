import type { Entity, Quat, Vec3, Viewport } from "@3dverse/livelink";
import type { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import {
    clamp,
    cross,
    dot,
    len,
    normalizeQuat,
    normalizeVec3,
    rotateVec3,
    quatConj,
    quatMul,
    scale,
    sub,
    EPS,
    rotateVec3ByQuat,
    add,
} from "./math";
import { emitDebug3d, renderPlane } from "./trash";

//------------------------------------------------------------------------------
export type Viewpoint = { position: Vec3; orientation: Quat };
export type Padding = { left: number; right: number; top: number; bottom: number }; // fractions of screen (0 .. 1.0)

//------------------------------------------------------------------------------
// AABB
function cornersOfAABB(min: Vec3, max: Vec3): Vec3[] {
    const out: Vec3[] = [];
    for (const x of [min[0], max[0]])
        for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) out.push([x, y, z]);
    return out;
}

// Your offset-aware focal point
export function AABBFocalPoint(data: { aabb: { min: Vec3; max: Vec3 }; offset?: Vec3 }): Vec3 {
    const o = data.offset ?? [0, 0, 0];
    return [0, 1, 2].map((i) => {
        const mn = data.aabb.min[i as 0 | 1 | 2];
        const mx = data.aabb.max[i as 0 | 1 | 2];
        const c = (mn + mx) * 0.5;
        const h = (mx - mn) * 0.5;
        return c + o[i as 0 | 1 | 2] * h;
    }) as Vec3;
}

//------------------------------------------------------------------------------
export function AABBViewpoint(data: {
    aabb: { min: Vec3; max: Vec3 };
    aabbOffset?: Vec3;
    focalPoint?: Vec3;
    orientation: Quat;
    cameraFov: number; // vertical FOV radians
    aspect?: number; // width/height
    padding?: Partial<Padding>; // []
    minDistance?: number;
}): Viewpoint {
    const focalPoint = data.focalPoint || AABBFocalPoint({ aabb: data.aabb, offset: data.aabbOffset });

    const aspect = Math.max(1e-6, data.aspect ?? 1); // aspect is never 0 or negative

    const fovY = clamp((data.cameraFov * Math.PI) / 180, 1e-6, Math.PI - 1e-6);
    const fovX = clamp(2 * Math.atan(Math.tan(fovY * 0.5) * aspect), 1e-6, Math.PI - 1e-6);

    //------------------------------------------------------------------------------
    function worldToPlaneSpace(world: Vec3, focalpoint: Vec3, orientation: Quat): Vec3 {
        const v = sub(world, focalpoint);
        const inv = quatConj(orientation); // for unit quats, inverse = conjugate
        return rotateVec3ByQuat(v, inv);
    }

    const halfFovX = fovX * 0.5;
    const halfFovY = fovY * 0.5;
    let largestX = 0;
    let largestY = 0;

    const corners = cornersOfAABB(data.aabb.min, data.aabb.max);

    let minX = +Infinity;
    let maxX = -Infinity;
    let minY = +Infinity;
    let maxY = -Infinity;

    let minXproj = +Infinity;
    let maxXproj = -Infinity;
    let minYproj = +Infinity;
    let maxYproj = -Infinity;

    for (const corner of corners) {
        const p = worldToPlaneSpace(corner as Vec3, focalPoint, data.orientation);

        const px = p[0]; // right
        const py = p[1]; // up
        const pz = p[2]; // forward

        // Horizontal requirement
        const offsetX = Math.abs(pz) * Math.tan(halfFovX) * Math.sign(px) * Math.sign(pz) * -1;
        const pxp = px + offsetX;
        const reqX = Math.abs(pxp);
        if (reqX > largestX) largestX = reqX;

        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minXproj = Math.min(minXproj, pxp);
        maxXproj = Math.max(maxXproj, pxp);

        // Vertical requirement
        const offsetY = Math.abs(pz) * Math.tan(halfFovY) * Math.sign(py) * Math.sign(pz) * -1;
        const pyp = py + offsetY;
        const reqY = Math.abs(pyp);
        if (reqY > largestY) largestY = reqY;

        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
        minYproj = Math.min(minYproj, pyp);
        maxYproj = Math.max(maxYproj, pyp);
    }

    // ensure camera ends up in front of everything (avoid zCam <= 0)
    const distanceX = largestX / Math.tan(halfFovX);
    const distanceY = largestY / Math.tan(halfFovY);
    const distance = Math.max(distanceX, distanceY, 1e-4);

    const forward = rotateVec3(data.orientation, [0, 0, 1]);

    const position = add(focalPoint, scale(forward, distance));

    emitDebug3d([
        ...renderPlane(data.orientation, focalPoint, minX, maxX, minY, maxY, minXproj, maxXproj, minYproj, maxYproj),
        { position, label: "target pos" },
        ...corners.map((position) => ({ position })),
    ]);

    return { position, orientation: data.orientation };
}

//------------------------------------------------------------------------------
function quatFromAxisAngle(axisIn: Vec3, angleRad: number): Quat {
    const axis = normalizeVec3(axisIn);
    const half = angleRad * 0.5;
    const s = Math.sin(half);
    const c = Math.cos(half);
    return normalizeQuat([axis[0] * s, axis[1] * s, axis[2] * s, c]);
}

//------------------------------------------------------------------------------
export function clampAngleToDirectionCone(angle: Quat, centerDir: Vec3, toleranceDeg: number): Quat {
    const q = normalizeQuat(angle);

    const c = normalizeVec3(centerDir);
    if (len(c) < EPS) return q;

    const tol = (toleranceDeg * Math.PI) / 180;

    const FORWARD: Vec3 = [0, 0, 1];

    // ---- swing-twist decomposition around local FORWARD (preserves "roll") ----
    const twist = extractTwistAroundAxis(q, FORWARD); // roll
    const swing = normalizeQuat(quatMul(q, quatConj(twist))); // q = swing * twist  => swing = q * twist^-1

    // Current forward from swing (no roll component)
    const cur = normalizeVec3(rotateVec3ByQuat(FORWARD, swing));
    if (len(cur) < EPS) return q;

    // NOTE: clamp to [-1, 1], not [0, 1]
    const d = clampNeg1To1(dot(cur, c));
    const ang = Math.acos(d);
    if (ang <= tol + 1e-6) return q;

    // Rotate cur toward c by (ang - tol)
    let axis = cross(cur, c);
    if (len(axis) < EPS) {
        // parallel/opposite: pick any orthogonal axis
        axis = cross(cur, [1, 0, 0]);
        if (len(axis) < EPS) axis = cross(cur, [0, 1, 0]);
    }
    axis = normalizeVec3(axis);

    const delta = ang - tol;
    const corr = quatFromAxisAngle(axis, delta);

    // Apply correction to SWING only (world space), then reapply TWIST (roll)
    const swingClamped = normalizeQuat(quatMul(corr, swing));
    return normalizeQuat(quatMul(swingClamped, twist));
}

// ---------------- helpers ----------------
function clampNeg1To1(x: number): number {
    return Math.max(-1, Math.min(1, x));
}

// Extract twist (rotation around `axis` in *local space* of the quaternion).
// axis must be normalized.
function extractTwistAroundAxis(qIn: Quat, axisIn: Vec3): Quat {
    const q = normalizeQuat(qIn);
    const axis = normalizeVec3(axisIn);

    const v: Vec3 = [q[0], q[1], q[2]];
    const projLen = dot(v, axis);
    const proj: Vec3 = [axis[0] * projLen, axis[1] * projLen, axis[2] * projLen];

    // twist quaternion has vector part = projection of q.xyz onto axis, same w
    const twist: Quat = [proj[0], proj[1], proj[2], q[3]];

    // If degenerate, return identity
    if (Math.hypot(twist[0], twist[1], twist[2], twist[3]) < EPS) return [0, 0, 0, 1];

    return normalizeQuat(twist);
}

//------------------------------------------------------------------------------
export function lookQuatUpright(point1: Vec3, point2: Vec3, worldUp: Vec3 = [0, 1, 0]): Quat {
    // Forward (camera) direction: point2 -> point1 (same as your code)
    const f = normalizeVec3([point1[0] - point2[0], point1[1] - point2[1], point1[2] - point2[2]]);
    if (len(f) < EPS) return [0, 0, 0, 1];

    // Right = up x forward
    let r = cross(worldUp, f);
    if (len(r) < EPS) {
        // forward is parallel to worldUp -> pick a fallback up
        const fallbackUp: Vec3 = Math.abs(worldUp[1]) < 0.999 ? [0, 1, 0] : [1, 0, 0];
        r = cross(fallbackUp, f);
    }
    r = normalizeVec3(r);

    // True up = forward x right (guaranteed orthonormal)
    const u = cross(f, r);

    // Build rotation that maps local basis to world basis.
    // Assuming camera local axes: Right = +X, Up = +Y, Forward = +Z
    const m00 = r[0],
        m01 = u[0],
        m02 = f[0];
    const m10 = r[1],
        m11 = u[1],
        m12 = f[1];
    const m20 = r[2],
        m21 = u[2],
        m22 = f[2];

    return normalizeQuat(quatFromMat3([m00, m01, m02, m10, m11, m12, m20, m21, m22]));
}

//------------------------------------------------------------------------------
function quatFromMat3(m: number[]): Quat {
    const m00 = m[0],
        m01 = m[1],
        m02 = m[2];
    const m10 = m[3],
        m11 = m[4],
        m12 = m[5];
    const m20 = m[6],
        m21 = m[7],
        m22 = m[8];

    const trace = m00 + m11 + m22;
    let x = 0,
        y = 0,
        z = 0,
        w = 1;

    if (trace > 0) {
        const s = Math.sqrt(trace + 1.0) * 2;
        w = 0.25 * s;
        x = (m21 - m12) / s;
        y = (m02 - m20) / s;
        z = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
        const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
        w = (m21 - m12) / s;
        x = 0.25 * s;
        y = (m01 + m10) / s;
        z = (m02 + m20) / s;
    } else if (m11 > m22) {
        const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
        w = (m02 - m20) / s;
        x = (m01 + m10) / s;
        y = 0.25 * s;
        z = (m12 + m21) / s;
    } else {
        const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
        w = (m10 - m01) / s;
        x = (m02 + m20) / s;
        y = (m12 + m21) / s;
        z = 0.25 * s;
    }

    return [x, y, z, w];
}

//------------------------------------------------------------------------------
const DEFAULT_ORIENTATION: Quat = [-0.16043, 0.37687, 0.06645, 0.91072];

const ORIENTATION_BY_NODE_TYPE: Record<string, Quat> = {
    FACTORY: [-0.6036809086799622, 0.00048551723011769354, 0.00036738935159519315, 0.797225832939148],
    AREA: [-0.1172819510102272, 0.4298095107078552, 0.05641791224479675, 0.8934907913208008],
    CELL: [-0.16281971476827492, 0.30383855316504915, 0.052784601893145586, 0.9372223108186922],
    MACHINE: [-0.010867751372844726, 0.3934001860658572, 0.004650729594915339, 0.9192913337444676],
};

export const getDefaultOrientationForNodeType = (nodeType: string): Quat =>
    ORIENTATION_BY_NODE_TYPE[nodeType] ?? DEFAULT_ORIENTATION;

//------------------------------------------------------------------------------
const findFirstParentLinker = async (entity: Entity): Promise<Entity | null> => {
    let parent = entity.parent;
    while (parent) {
        if (parent.scene_ref) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
};

//------------------------------------------------------------------------------
export const moveCamera = async (
    entity: Entity,
    cameraController: DefaultCameraController,
    viewport: Viewport,
    cameraEntity: Entity,
    orientation: Quat = DEFAULT_ORIENTATION,
) => {
    const aspect = viewport.width / viewport.height;
    let destination: Vec3 = [0, 0, 0];
    let target: Vec3 = [...entity.global_aabb.center];

    const children = await entity.getChildren();
    const povIdx = children.findIndex((c) => c.name === "camera:pov");
    if (povIdx !== -1) {
        // If you have a child named "camera:pov", use its position as the camera
        // target (ignoring orientation as it's defined by the look at target ).
        const povEntity = children[povIdx];
        if (povEntity.label) {
            const pov = povEntity.label.camera;
            destination = [pov[0], pov[1], pov[2]];
            target = povEntity.global_transform.position;
        } else {
            destination = povEntity.global_transform.position;
        }

        // If the entity has a "camera:pov" child, we assume it's defined in local space of some parent linker,
        // so we need to add that linker's world position to get the correct global destination.
        const parentLinker = await findFirstParentLinker(entity);
        if (parentLinker) {
            destination = add(destination, parentLinker.global_transform.position);
        }
    } else {
        // Otherwise, frame the whole entity in view using its AABB and the provided/default orientation.
        const viewpoint = AABBViewpoint({
            aabb: entity.global_aabb,
            aabbOffset: [0, -1, 0],
            cameraFov: cameraEntity.perspective_lens?.fovy || 90,
            orientation,
            aspect,
        });
        destination = viewpoint.position;
    }

    window.dispatchEvent(new CustomEvent("cameraMoving"));
    cameraController.setLookAt(...destination, ...target, true).then(() => {
        window.dispatchEvent(new CustomEvent("cameraSettled"));
    });
};
