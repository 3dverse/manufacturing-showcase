import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FloorLabel = ({ node }: { node: SceneGraphNode }) => {
    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="bottom">
            <div className="p-8 relative w-full h-full border-8 border-accent rounded-3xl pointer-events-none transform-3d bg-red">
                <p className="text-accent font-semibold text-8xl capitalize">{node.name}</p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
