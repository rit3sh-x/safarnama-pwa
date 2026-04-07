import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth";
import schema from "./schema";
import type { RegisteredMutation } from "convex/server";

type AuthMutationWithModel<
    Args extends Record<string, unknown>,
    Ret,
> = RegisteredMutation<"public", Args, Ret>;

const _api = createApi(schema, createAuthOptions);

export const create = _api.create;
export const findOne = _api.findOne;
export const findMany = _api.findMany;
export const updateOne: AuthMutationWithModel<
    {
        onUpdateHandle?: string;
        input: {
            where?: {
                operator?: string;
                connector?: "AND" | "OR";
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[];
            update: Record<string, unknown>;
            model: string;
        };
    },
    Promise<unknown>
> = _api.updateOne;
export const updateMany: AuthMutationWithModel<
    {
        onUpdateHandle?: string;
        input: {
            where?: {
                operator?: string;
                connector?: "AND" | "OR";
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[];
            update: Record<string, unknown>;
            model: string;
        };
        paginationOpts: {
            id?: number;
            endCursor?: string | null;
            maximumRowsRead?: number;
            maximumBytesRead?: number;
            numItems: number;
            cursor: string | null;
        };
    },
    Promise<unknown>
> = _api.updateMany;
export const deleteOne: AuthMutationWithModel<
    {
        onDeleteHandle?: string;
        input: {
            where?: {
                operator?: string;
                connector?: "AND" | "OR";
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[];
            model: string;
        };
    },
    Promise<unknown>
> = _api.deleteOne;
export const deleteMany: AuthMutationWithModel<
    {
        onDeleteHandle?: string;
        input: {
            where?: {
                operator?: string;
                connector?: "AND" | "OR";
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[];
            model: string;
        };
        paginationOpts: {
            id?: number;
            endCursor?: string | null;
            maximumRowsRead?: number;
            maximumBytesRead?: number;
            numItems: number;
            cursor: string | null;
        };
    },
    Promise<unknown>
> = _api.deleteMany;
