import type { Entity, Quat, Vec3 } from "@3dverse/livelink";
import type { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
export const moveCamera = (entity: Entity, cameraController: DefaultCameraController) => {
    const labelComponent = entity.label;
    if (!labelComponent) {
        console.warn(`Entity ${entity.debug_name?.value} is not a label`);
        return;
    }

    // Extract camera pov from label component
    const position = labelComponent.camera.slice(0, 3) as Vec3;
    const orientation = labelComponent.camera.slice(3, 7) as Quat;

    const distance = cameraController.getTargetDistance();
    const forward = applyQuaternionToVector3(neutralForward, orientation);
    const scaledForward = forward.map((v) => v * distance) as Vec3;
    const target = addVec3(position, scaledForward);

    // Move the camera to the position and look at the target
    cameraController.setLookAt(...position, ...target, true);
};

//------------------------------------------------------------------------------
const neutralForward = [0, 0, -1] as Vec3;

//------------------------------------------------------------------------------
// Helper functions to perform vector and quaternion math without external libraries
function applyQuaternionToVector3(v: Vec3, q: Quat): Vec3 {
    // Quaternion rotation: v' = q * v * q^-1
    const [x, y, z] = v;
    const [qx, qy, qz, qw] = q;

    // Calculate quat * vector
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // Calculate result * inverse quat
    return [
        ix * qw + iw * -qx + iy * -qz - iz * -qy,
        iy * qw + iw * -qy + iz * -qx - ix * -qz,
        iz * qw + iw * -qz + ix * -qy - iy * -qx,
    ];
}

//------------------------------------------------------------------------------
function addVec3(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
