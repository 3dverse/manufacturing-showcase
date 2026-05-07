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
                <span className="block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 aspect-square bg-accent rounded-full blur-3xl" />
                <p className="text-accent font-semibold text-8xl capitalize">{node.name}</p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
