import config from "../config";

//------------------------------------------------------------------------------
import type { ErrorObject } from "ajv";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import type { Context } from "openapi-backend";
import type {
    HandlerResponse as APSHandlerResponse,
    OperationContext as APSOperationContext,
    OperationHandlerResponse as APSOperationHandlerResponse,
    Operations as APSOperations,
} from "../../../_prebuild/api-types/aps";
import type {
    HandlerResponse as EAMHandlerResponse,
    OperationContext as EAMOperationContext,
    OperationHandlerResponse as EAMOperationHandlerResponse,
    Operations as EAMOperations,
} from "../../../_prebuild/api-types/eam";
import type {
    HandlerResponse as ERPHandlerResponse,
    OperationContext as ERPOperationContext,
    OperationHandlerResponse as ERPOperationHandlerResponse,
    Operations as ERPOperations,
} from "../../../_prebuild/api-types/erp";
import type {
    HandlerResponse as MESHandlerResponse,
    OperationContext as MESOperationContext,
    OperationHandlerResponse as MESOperationHandlerResponse,
    Operations as MESOperations,
} from "../../../_prebuild/api-types/mes";
import type {
    HandlerResponse as QMSHandlerResponse,
    OperationContext as QMSOperationContext,
    OperationHandlerResponse as QMSOperationHandlerResponse,
    Operations as QMSOperations,
} from "../../../_prebuild/api-types/qms";
import type {
    HandlerResponse as WMSHandlerResponse,
    OperationContext as WMSOperationContext,
    OperationHandlerResponse as WMSOperationHandlerResponse,
    Operations as WMSOperations,
} from "../../../_prebuild/api-types/wms";
import type {
    HandlerResponse as DatasetHandlerResponse,
    OperationContext as DatasetOperationContext,
    OperationHandlerResponse as DatasetOperationHandlerResponse,
    Operations as DatasetOperations,
} from "../../../_prebuild/api-types/dataset";

//------------------------------------------------------------------------------
export type APSOperationHandler<operationId extends keyof APSOperations> = (
    c: APSOperationContext<keyof APSOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<APSOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const APSreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): APSHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as APSHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type EAMOperationHandler<operationId extends keyof EAMOperations> = (
    c: EAMOperationContext<keyof EAMOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<EAMOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const EAMreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): EAMHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as EAMHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type ERPOperationHandler<operationId extends keyof ERPOperations> = (
    c: ERPOperationContext<keyof ERPOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<ERPOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const ERPreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): ERPHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as ERPHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type MESOperationHandler<operationId extends keyof MESOperations> = (
    c: MESOperationContext<keyof MESOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<MESOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const MESreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): MESHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as MESHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type QMSOperationHandler<operationId extends keyof QMSOperations> = (
    c: QMSOperationContext<keyof QMSOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<QMSOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const QMSreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): QMSHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as QMSHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type WMSOperationHandler<operationId extends keyof WMSOperations> = (
    c: WMSOperationContext<keyof WMSOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<WMSOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const WMSreplyJSON = <T>(json: T, res: ExpressResponse, statusCode: number = 200): WMSHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as WMSHandlerResponse<T>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export type DatasetOperationHandler<operationId extends keyof DatasetOperations> = (
    c: DatasetOperationContext<keyof DatasetOperations>,
    req: ExpressRequest,
    res: ExpressResponse,
) => Promise<DatasetOperationHandlerResponse<operationId>>;

//------------------------------------------------------------------------------
export const DatasetreplyJSON = <T>(
    json: T,
    res: ExpressResponse,
    statusCode: number = 200,
): DatasetHandlerResponse<T> => {
    // If HandlerResponse<T> === ExpressResponse, this is perfect.
    // If not, you can `return res.status(statusCode).json(json) as unknown as HandlerResponse<T>;`
    return res.status(statusCode).json(json) as unknown as DatasetHandlerResponse<T>;
};

//------------------------------------------------------------------------------
export const NotImplemented = (c: Context, req: ExpressRequest, res: ExpressResponse) => {
    const opId = c.operation.operationId;
    if (!opId) {
        return res.status(500).json({
            status: 500,
            code: "MISSING_OPERATION_ID",
            message: "OperationId is missing from OpenAPI context",
        });
    }

    if (config.allowMock || config.environment !== "local") {
        const mocked = c.api.mockResponseForOperation(opId);

        if (mocked) {
            const { status, mock } = mocked;
            return res.status(status).json(mock);
        }

        return res.status(501).json({
            status: 501,
            code: "NOT_IMPLEMENTED_NO_MOCK",
            message: `Not implemented (no mock available for operationId: ${opId})`,
            operationId: opId,
        });
    }

    return res.status(501).json({
        status: 501,
        code: "NOT_IMPLEMENTED",
        message: "This endpoint is not implemented",
        operationId: opId,
    });
};

//------------------------------------------------------------------------------
type ValidationFailContext = Context & {
    validation: {
        errors: ErrorObject[];
    };
};

//------------------------------------------------------------------------------
export const ValidationFail = (c: ValidationFailContext, req: ExpressRequest, res: ExpressResponse) => {
    return res.status(400).json({ status: 400, err: c.validation.errors });
};

//------------------------------------------------------------------------------
type ErrorBody = {
    status: number;
    error: string;
    message: string;
    path: string;
    method: string;
};

//------------------------------------------------------------------------------
export function MethodNotAllowed(c: Context, req: ExpressRequest, res: ExpressResponse): ExpressResponse<ErrorBody> {
    return res.status(405).json({
        status: 405,
        error: "method_not_allowed",
        message: `Method ${req.method} is not allowed for ${req.path}`,
        path: req.path,
        method: req.method,
    });
}
