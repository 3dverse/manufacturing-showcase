import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import OpenAPIBackend, { AjvCustomizer } from "openapi-backend";
import addFormats from "ajv-formats";

//------------------------------------------------------------------------------
import { MethodNotAllowed, NotImplemented, ValidationFail } from "./utils/openAPI";
import { ApiTag, operations } from "./operations";

//------------------------------------------------------------------------------
export const apiConfigs: { name: ApiTag; spec: string; prefix: string; docs?: boolean }[] = [
    { name: ApiTag.APS, spec: "./server/spec/APS.yaml", prefix: "/aps", docs: true },
    { name: ApiTag.EAM, spec: "./server/spec/EAM.yaml", prefix: "/eam", docs: true },
    { name: ApiTag.ERP, spec: "./server/spec/ERP.yaml", prefix: "/erp", docs: true },
    { name: ApiTag.MES, spec: "./server/spec/MES.yaml", prefix: "/mes", docs: true },
    { name: ApiTag.QMS, spec: "./server/spec/QMS.yaml", prefix: "/qms", docs: true },
    { name: ApiTag.WMS, spec: "./server/spec/WMS.yaml", prefix: "/wms", docs: true },
    { name: ApiTag.DATASET, spec: "./server/spec/dataset.yaml", prefix: "/dataset" },
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
export const apis = apiConfigs.map(({ name, spec, prefix, docs }) => {
    const api = new OpenAPIBackend({
        definition: spec,
        apiRoot: prefix,
        customizeAjv,
    });
    api.register("notImplemented", NotImplemented);
    api.register("validationFail", ValidationFail);
    api.register("methodNotAllowed", MethodNotAllowed);

    // Inject openapi-backend path params into req.params so handlers can read them normally
    const ops = operations[name];
    const wrapped = Object.fromEntries(
        Object.entries(ops).map(([opId, handler]) => [
            opId,
            (context: any, req: any, res: any) => {
                if (context.request?.params) Object.assign(req.params, context.request.params);
                return (handler as any)(context, req, res);
            },
        ]),
    );
    api.register(wrapped);
    api.init();
    return { name, prefix, api, docs };
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
