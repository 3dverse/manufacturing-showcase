import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import OpenAPIBackend, { AjvCustomizer } from "openapi-backend";
import addFormats from "ajv-formats";

//------------------------------------------------------------------------------
import { MethodNotAllowed, NotImplemented, ValidationFail } from "./utils/openAPI";
import { ApiTag, operations } from "./operations";

//------------------------------------------------------------------------------
export const apiConfigs: { name: ApiTag; spec: string; prefix: string }[] = [
    { name: ApiTag.APS, spec: "./server/spec/APS.yaml", prefix: "/aps" },
    { name: ApiTag.EAM, spec: "./server/spec/EAM.yaml", prefix: "/eam" },
    { name: ApiTag.ERP, spec: "./server/spec/ERP.yaml", prefix: "/erp" },
    { name: ApiTag.MES, spec: "./server/spec/MES.yaml", prefix: "/mes" },
    { name: ApiTag.QMS, spec: "./server/spec/QMS.yaml", prefix: "/qms" },
    { name: ApiTag.WMS, spec: "./server/spec/WMS.yaml", prefix: "/wms" },
];

//------------------------------------------------------------------------------
const customizeAjv: AjvCustomizer = (ajv) => {
    addFormats(ajv, {
        mode: "fast",
        formats: ["date", "date-time", "email", "uri", "uuid"],
    });

    return ajv;
};
//------------------------------------------------------------------------------
export const apis = apiConfigs.map(({ name, spec, prefix }) => {
    const api = new OpenAPIBackend({
        definition: spec,
        apiRoot: prefix,
        customizeAjv,
    });
    api.register("notImplemented", NotImplemented);
    api.register("validationFail", ValidationFail);
    api.register("methodNotAllowed", MethodNotAllowed);
    api.register(operations[name]);
    api.init();
    return { name, prefix, api };
});

//------------------------------------------------------------------------------
export function apiRequestHandler(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
    const apiEntry = apis.find(({ prefix }) => req.path.startsWith(prefix));
    if (!apiEntry) {
        return next();
    }
    return apiEntry.api.handleRequest(
        {
            method: req.method,
            path: req.path,
            body: req.body,
            query: req.query as Record<string, string | string[]>,
            headers: req.headers as Record<string, string | string[]>,
        },
        req,
        res,
    );
}
